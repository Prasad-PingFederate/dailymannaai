import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As suggested by the Vercel error log to silence Turbopack errors
  // @ts-ignore
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
