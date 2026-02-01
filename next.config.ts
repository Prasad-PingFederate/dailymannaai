import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SILENCE: Follow Vercel's "TIP" to solve WorkerError / Call retries exceeded
  // @ts-ignore
  turbopack: {},

  webpack: (config) => {
    // Definitive fix for canvas dependencies during bundling
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Ignore native node modules
    config.externals.push('child_process', 'node:child_process');

    return config;
  }
};

export default nextConfig;
