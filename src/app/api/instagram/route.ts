import { NextResponse } from 'next/server';
import { getInstagramProfile } from '@/lib/instagram';

// Simple in-memory rate limiting
const rateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { message: 'Username is required' },
      { status: 400 }
    );
  }

  // Check rate limit
  const now = Date.now();
  const userRequests = rateLimit.get(username) || 0;
  
  if (userRequests >= MAX_REQUESTS) {
    return NextResponse.json(
      { message: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  // Update rate limit
  rateLimit.set(username, userRequests + 1);
  setTimeout(() => {
    rateLimit.delete(username);
  }, RATE_LIMIT_WINDOW);

  try {
    console.log(`Fetching Instagram profile for: ${username}`);
    const analysis = await getInstagramProfile(username);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in Instagram API route:', error);
    
    // Handle specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Instagram data';
    
    if (errorMessage.includes('private')) {
      return NextResponse.json(
        { message: 'This Instagram profile is private' },
        { status: 403 }
      );
    }
    
    if (errorMessage.includes('login')) {
      return NextResponse.json(
        { message: 'Instagram requires login to view this profile' },
        { status: 401 }
      );
    }
    
    if (errorMessage.includes('No posts found')) {
      return NextResponse.json(
        { message: 'No posts found on this profile' },
        { status: 404 }
      );
    }

    // For other errors, return a more detailed error message
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 