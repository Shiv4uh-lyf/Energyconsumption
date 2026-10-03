/** @type {import('next').NextConfig} */

// Render's `fromService` with `property: hostport` gives "hostname:port"
// (no protocol). Internal Render service-to-service traffic uses plain http.
// Locally it falls back to http://127.0.0.1:8000.
function getBackendUrl() {
  const raw = process.env.BACKEND_INTERNAL_URL || '';
  if (!raw) return 'http://127.0.0.1:8000';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `http://${raw}`; // prepend http:// for internal Render hostport
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
