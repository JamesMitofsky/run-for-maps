import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared logic (@rosm/core) ships as TypeScript source; Next must compile it.
  transpilePackages: ["@rosm/core"],
  async redirects() {
    return [
      // Old URL for the fountain browser — keep bookmarks/PWA shortcuts alive.
      { source: "/public-fountains", destination: "/fountains", permanent: true },
      // Sign-in moved from the planner-scoped URL to an app-wide gate.
      { source: "/plan/login", destination: "/login?returnTo=/plan", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Service worker must not be cached so updates ship immediately.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
