/** @type {import('next').NextConfig} */

// Normalise the backend URL: ensure it always has an http/https prefix.
// Render's `property: url` returns a full https:// URL, but guard
// against bare `host:port` values just in case.
function getBackendUrl() {
  const raw = process.env.BACKEND_INTERNAL_URL || '';
  if (!raw) return 'http://127.0.0.1:8000';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

const BACKEND_URL = getBackendUrl();

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
