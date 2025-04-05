'use client';

import { useState } from 'react';
import { InstagramPost, InstagramAnalysis } from '@/lib/instagram';

export default function Home() {
  const [username, setUsername] = useState('');
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzingPosts, setAnalyzingPosts] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const url = `/api/instagram?username=${username}`;
      console.log(`Fetching data from: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch Instagram data');
      }

      setAnalysis(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async (post: InstagramPost) => {
    if (analyzingPosts.has(post.url)) return;
    
    setAnalyzingPosts(prev => new Set(prev).add(post.url));
    
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: post.imageUrl,
          caption: post.caption,
          hashtags: post.caption.match(/#[\w\u0590-\u05ff]+/g) || [],
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze image');
      
      const data = await response.json();
      
      setAnalysis(prev => {
        if (!prev) return null;
        return {
          ...prev,
          posts: prev.posts.map(p => 
            p.url === post.url 
              ? { ...p, analysis: data.analysis }
              : p
          ),
        };
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setAnalyzingPosts(prev => {
        const next = new Set(prev);
        next.delete(post.url);
        return next;
      });
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Instagram Analytics</h1>
        <p className="text-gray-600 mb-8">Analyze your Instagram profile to optimize your content strategy</p>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Instagram username"
                className="flex-1 p-2 border rounded"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Analyzing...' : 'Analyze Profile'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-8 bg-red-100 text-red-700 rounded">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {analysis && (
          <div className="grid gap-8">
            {/* Summary Stats */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Profile Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                  <h3 className="font-bold text-blue-700">Average Engagement</h3>
                  <p className="text-2xl">{Math.round(analysis.averageEngagement)}</p>
                  <p className="text-sm text-gray-600">likes + comments per post</p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <h3 className="font-bold text-green-700">Best Day to Post</h3>
                  <p className="text-2xl">{analysis.bestPerformingDay}</p>
                  <p className="text-sm text-gray-600">for maximum engagement</p>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <h3 className="font-bold text-purple-700">Best Time to Post</h3>
                  <p className="text-2xl">{analysis.bestPerformingTime}</p>
                  <p className="text-sm text-gray-600">for maximum reach</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
              <ul className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Performing Posts */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Top 5 Performing Posts</h2>
              <div className="grid gap-6">
                {analysis.posts.map((post, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {post.imageUrl && (
                        <div className="md:w-1/3 h-64 md:h-auto">
                          <img 
                            src={`/api/proxy-image?url=${encodeURIComponent(post.imageUrl)}`}
                            alt={`Instagram post by ${username}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Handle image loading errors
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="p-4 md:w-2/3">
                        <div className="flex justify-between mb-2">
                          <span className="flex items-center">
                            <span className="text-red-500 mr-1">❤️</span> {post.likes}
                          </span>
                          <span className="flex items-center">
                            <span className="text-blue-500 mr-1">💬</span> {post.comments}
                          </span>
                          <span className="flex items-center">
                            <span className="text-green-500 mr-1">📊</span> {post.engagement}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{post.caption}</p>
                        <div className="flex justify-between items-center">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm"
                          >
                            View Post
                          </a>
                          <button
                            onClick={() => analyzeImage(post)}
                            disabled={analyzingPosts.has(post.url)}
                            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400"
                          >
                            {analyzingPosts.has(post.url) ? 'Analyzing...' : 'Analyze Image'}
                          </button>
                        </div>
                        {post.analysis && (
                          <div className="mt-4 p-4 bg-gray-50 rounded">
                            <h3 className="font-semibold mb-2">AI Analysis</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{post.analysis}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtag Analysis */}
            {Object.keys(analysis.hashtagAnalysis).length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Hashtag Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(analysis.hashtagAnalysis)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([hashtag, engagement], index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <p className="font-medium">{hashtag}</p>
                        <p className="text-sm text-gray-600">{engagement} engagement</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Caption Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Caption Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-bold">Average Caption Length</h3>
                  <p className="text-xl">{Math.round(analysis.captionLengthAnalysis.average)} characters</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-bold">Optimal Caption Length</h3>
                  <p className="text-xl">{analysis.captionLengthAnalysis.bestLength} characters</p>
                  <p className="text-sm text-gray-600">for maximum engagement</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
