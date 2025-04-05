import { NextResponse } from 'next/server';
import Replicate from 'replicate';

// Initialize Replicate client with API token from environment variable
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const { imageUrl, caption, hashtags } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const prompt = `Analyze this Instagram post image. Consider the following context:
    ${caption ? `Caption: ${caption}` : ''}
    ${hashtags ? `Hashtags: ${hashtags.join(', ')}` : ''}
    
    Please provide insights on:
    1. Visual elements and composition
    2. How the image relates to the caption and hashtags
    3. Why this image might be performing well
    4. Suggestions for improvement`;

    const output = await replicate.run(
      "yorickvp/llava-v1.6-mistral-7b:19be067b589d0c46689ffa7cc3ff321447a441986a7694c01225973c2eafc874",
      {
        input: {
          image: imageUrl,
          prompt: prompt,
          temperature: 0.7,
          max_tokens: 500,
        }
      }
    );

    return NextResponse.json({ analysis: output });
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
} 