/** @type {import('next').NextConfig} */

// Cloudflare Pages uses @cloudflare/next-on-pages which requires no output override.
// Vercel and Docker both use 'standalone' output.
// CF_PAGES env var is automatically injected in Cloudflare Pages build environments.
const isCloudflarePages = process.env.CF_PAGES === '1';

const nextConfig = {
  reactStrictMode: true,

  // 'standalone' for Vercel/Docker, default (undefined) for Cloudflare Pages
  output: isCloudflarePages ? undefined : 'standalone',

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },

  // Security headers — also enforced at CDN level via vercel.json / _headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Proxy /api/* calls to the backend in development
  // In production, Vercel's vercel.json rewrites handle this
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
