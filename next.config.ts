import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Raised from default 1MB to accommodate Base64 uploads
    },
  },
};

export default nextConfig;