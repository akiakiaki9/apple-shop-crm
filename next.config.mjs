/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: 'https://api.cconnect.uz/:path*',
      },
    ];
  },
};

export default nextConfig;
