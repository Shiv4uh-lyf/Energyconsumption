/** @type {import('next').NextConfig} */

// BACKEND_INTERNAL_URL: used by Next.js server-side API rewrites.
// On Render, set this to the backend's internal service URL (or public URL).
// Locally, falls back to localhost.
// Format: http://hostname:port  (no trailing slash)
function getBackendUrl() {
  const raw = process.env.BACKEND_INTERNAL_URL || '';
  if (!raw) return 'http://127.0.0.1:8000';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  // Render's hostport gives "hostname:port" without protocol
  return `http://${raw}`;
}

const BACKEND_URL = getBackendUrl();

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // Rewrite /api/* to the backend — avoids CORS issues for browser clients
  // because all requests appear to come from the same origin.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  // Expose the backend URL to browser code ONLY if explicitly set
  // (NEXT_PUBLIC_API_URL is used as fallback in api.ts when running standalone)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

module.exports = nextConfig;
