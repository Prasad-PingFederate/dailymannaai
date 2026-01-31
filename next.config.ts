import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // This is the CRITICAL fix for PDF.js on Vercel/Next.js
    if (isServer) {
      config.resolve.alias.canvas = false;
    } else {
      config.resolve.alias.canvas = false;
    }
    return config;
  },
  experimental: {
    // Just disable turbo for now if it continues to fail, 
    // or try the alias correctly.
  },
  // Ensure we use the standard build, not Turbopack if it's causing issues.
};

export default nextConfig;
