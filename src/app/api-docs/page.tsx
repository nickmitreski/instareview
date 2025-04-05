'use client';

import { useState } from 'react';

export default function ApiDocs() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testApi = async () => {
    setLoading(true);
    setError('');
    setResponse('');
    
    try {
      const res = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'instagram',
          analyzeImages: true,
        }),
      });
      
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError('Error testing API: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Instagram Analytics API Documentation</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <p className="mb-4">
            This API provides Instagram profile analysis, including engagement metrics, 
            post performance, and AI-powered image analysis.
          </p>
          <p className="mb-4">
            The API is designed to be consumed by external applications and supports CORS for cross-origin requests.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Analyze Instagram Profile</h3>
            <div className="bg-gray-100 p-4 rounded mb-2">
              <code className="text-sm">POST /api/analyze-profile</code>
            </div>
            
            <h4 className="font-semibold mt-4 mb-2">Request Body</h4>
            <div className="bg-gray-100 p-4 rounded mb-2">
              <pre className="text-sm overflow-x-auto">
{`{
  "username": "instagram", // Required: Instagram username to analyze
  "analyzeImages": true    // Optional: Whether to analyze images with AI (default: false)
}`}
              </pre>
            </div>
            
            <h4 className="font-semibold mt-4 mb-2">Response</h4>
            <div className="bg-gray-100 p-4 rounded mb-2">
              <pre className="text-sm overflow-x-auto">
{`{
  "posts": [
    {
      "likes": 1234,
      "comments": 56,
      "timestamp": "2023-01-01T12:00:00Z",
      "caption": "Post caption with #hashtags",
      "url": "https://www.instagram.com/p/abc123/",
      "imageUrl": "https://instagram.com/image.jpg",
      "engagement": 1290,
      "dayOfWeek": "Monday",
      "timeOfDay": "Afternoon",
      "analysis": "AI analysis of the image..." // Only included if analyzeImages is true
    }
  ],
  "averageEngagement": 1200,
  "bestPerformingDay": "Monday",
  "bestPerformingTime": "Afternoon",
  "hashtagAnalysis": {
    "#hashtag1": 500,
    "#hashtag2": 300
  },
  "captionLengthAnalysis": {
    "average": 120,
    "bestLength": 150
  },
  "recommendations": [
    "Post on Mondays during afternoon for maximum engagement",
    "Your best performing posts have captions around 150 characters long"
  ]
}`}
              </pre>
            </div>
            
            <h4 className="font-semibold mt-4 mb-2">Error Responses</h4>
            <div className="bg-gray-100 p-4 rounded mb-2">
              <pre className="text-sm overflow-x-auto">
{`{
  "error": "Error message"
}`}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Possible status codes: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 
              404 (Not Found), 429 (Rate Limit Exceeded), 500 (Server Error)
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Example Usage</h2>
          
          <h3 className="text-xl font-semibold mb-2">JavaScript/TypeScript</h3>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <pre className="text-sm overflow-x-auto">
{`// Using fetch
const analyzeProfile = async (username) => {
  const response = await fetch('https://your-api-url.com/api/analyze-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      analyzeImages: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze profile');
  }
  
  return await response.json();
};

// Using axios
import axios from 'axios';

const analyzeProfile = async (username) => {
  try {
    const { data } = await axios.post('https://your-api-url.com/api/analyze-profile', {
      username,
      analyzeImages: true,
    });
    return data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to analyze profile');
    }
    throw error;
  }
};`}
            </pre>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Python</h3>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <pre className="text-sm overflow-x-auto">
{`import requests

def analyze_profile(username):
    response = requests.post(
        'https://your-api-url.com/api/analyze-profile',
        json={
            'username': username,
            'analyzeImages': True
        }
    )
    
    if not response.ok:
        error = response.json()
        raise Exception(error.get('error', 'Failed to analyze profile'))
    
    return response.json()`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Test the API</h2>
          <p className="mb-4">
            Click the button below to test the API with the Instagram official account:
          </p>
          
          <button
            onClick={testApi}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Testing...' : 'Test API'}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {response && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Response:</h3>
              <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                <pre className="text-sm">{response}</pre>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Rate Limiting</h2>
          <p className="mb-4">
            The API implements rate limiting to prevent abuse. Each client is limited to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>10 requests per minute</li>
            <li>Rate limits are tracked by IP address</li>
          </ul>
          <p>
            When the rate limit is exceeded, the API will return a 429 status code with an error message.
          </p>
        </div>
      </div>
    </main>
  );
} 