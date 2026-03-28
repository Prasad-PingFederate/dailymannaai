import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SILENCE: Follow Vercel's "TIP" to solve WorkerError / Call retries exceeded
  // @ts-ignore
  turbopack: {},

  // Clean up old URLs found by Googlebot to prevent 404s
  async redirects() {
    return [
      {
        source: '/prophetic-insights',
        destination: '/daily-manna',
        permanent: true, // 301 Redirect for SEO
      },
      {
        source: '/blog/:path*',
        destination: '/daily-manna',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
    ];
  },

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
