import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Fixes npm packages that depend on `canvas` module
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    // For Next.js Turbopack
    turbo: {
      resolveAlias: {
        canvas: './src/lib/empty.js',
      },
    },
  },
};

export default nextConfig;
