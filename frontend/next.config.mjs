/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for the lean Docker production runner (copies only necessary files)
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
};

export default nextConfig;
