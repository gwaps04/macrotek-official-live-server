import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use standalone output outside Vercel (avoids Next 16 onBuildComplete next-server.js.nft.json error on Vercel)
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Raised from default 1MB to accommodate Base64 uploads
    },
  },
};

export default nextConfig;