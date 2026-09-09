/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // In local development, proxy API calls to local FastAPI server on port 8000.
    // In production on Vercel, native routing and vercel.json handle Serverless Python execution.
    if (process.env.NODE_ENV === 'development') {
      const backendUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: '/health',
          destination: `${backendUrl}/health`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
