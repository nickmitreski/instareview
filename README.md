# Instagram Analytics API

A powerful API for analyzing Instagram profiles, including engagement metrics, post performance, and AI-powered image analysis.

## Features

- Profile analysis with engagement metrics
- Post performance tracking
- AI-powered image analysis using Replicate's vision model
- Hashtag performance analysis
- Caption length optimization
- Best posting time recommendations
- CORS support for cross-origin requests
- Rate limiting to prevent abuse

## Prerequisites

- Node.js 18+ and npm
- A Replicate API key for image analysis
- An OpenAI API key for enhanced analysis
- A Vercel account for deployment

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/nickmitreski/instareview.git
cd instareview
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your API keys:
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the file with your actual API keys
REPLICATE_API_TOKEN=your_replicate_api_key
OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## Deployment to Vercel

1. Install the Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the application:
```bash
vercel
```

4. Set up environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" section
   - Add your API keys:
     - `REPLICATE_API_KEY`
     - `OPENAI_API_KEY`

## API Documentation

Visit `/api-docs` in your browser to see the full API documentation, including:
- Available endpoints
- Request/response formats
- Example usage
- Rate limiting information

## Using the API

The main endpoint is `/api/analyze-profile`. Here's a simple example using JavaScript:

```javascript
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
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 10 requests per minute per IP address
- Rate limit exceeded returns 429 status code

## Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| `REPLICATE_API_TOKEN` | Your Replicate API key for image analysis |
| `OPENAI_API_KEY` | Your OpenAI API key for enhanced analysis |

Optional configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_REQUESTS` | Number of requests allowed per window | 10 |
| `RATE_LIMIT_WINDOW_MS` | Time window for rate limiting in milliseconds | 60000 |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
