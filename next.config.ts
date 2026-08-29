import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        // Collapse the www host onto the apex so search engines see one site
        // instead of splitting impressions across duplicate hosts.
        source: "/:path*",
        has: [{ type: "host", value: "www.gungeoncompanion.com" }],
        destination: "https://gungeoncompanion.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Never let a stale service worker pin users to an old build.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
