import { NextResponse } from 'next/server';
import { getInstagramProfile, InstagramPost } from '@/lib/instagram';
import Replicate from 'replicate';

// Initialize Replicate client with API token from environment variable
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

export async function POST(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  try {
    // Parse request body
    const { username, analyzeImages = false } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400, headers }
      );
    }

    // Check rate limit
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const userRateLimit = rateLimit.get(clientIp);

    if (userRateLimit) {
      if (now - userRateLimit.timestamp < RATE_LIMIT_WINDOW) {
        if (userRateLimit.count >= MAX_REQUESTS) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429, headers }
          );
        }
        userRateLimit.count++;
      } else {
        rateLimit.set(clientIp, { count: 1, timestamp: now });
      }
    } else {
      rateLimit.set(clientIp, { count: 1, timestamp: now });
    }

    // Get Instagram profile data
    const profileData = await getInstagramProfile(username);

    // If image analysis is requested, analyze each post
    if (analyzeImages && profileData.posts.length > 0) {
      const analyzedPosts = await Promise.all(
        profileData.posts.map(async (post) => {
          try {
            const hashtags = post.caption.match(/#[\w\u0590-\u05ff]+/g) || [];
            const hashtagsText = hashtags.length > 0 ? hashtags.join(', ') : '';
            
            const prompt = `Analyze this Instagram post image. Consider the following context:
            ${post.caption ? `Caption: ${post.caption}` : ''}
            ${hashtagsText ? `Hashtags: ${hashtagsText}` : ''}
            
            Please provide insights on:
            1. Visual elements and composition
            2. How the image relates to the caption and hashtags
            3. Why this image might be performing well
            4. Suggestions for improvement`;

            const output = await replicate.run(
              "yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874",
              {
                input: {
                  image: post.imageUrl,
                  prompt: prompt,
                  temperature: 0.7,
                  max_tokens: 500,
                }
              }
            );

            // Convert output to string if it's an array
            const analysisText = Array.isArray(output) ? output.join('') : String(output);

            return {
              ...post,
              analysis: analysisText
            } as InstagramPost;
          } catch (error) {
            console.error('Error analyzing image:', error);
            return post;
          }
        })
      );

      profileData.posts = analyzedPosts;
    }

    return NextResponse.json(profileData, { headers });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('private')) {
        return NextResponse.json(
          { error: 'This Instagram profile is private' },
          { status: 403, headers }
        );
      } else if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Instagram profile not found' },
          { status: 404, headers }
        );
      } else if (error.message.includes('login')) {
        return NextResponse.json(
          { error: 'Instagram requires login to view this profile' },
          { status: 401, headers }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze Instagram profile' },
      { status: 500, headers }
    );
  }
} 