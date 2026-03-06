import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Keep image revalidation short for frequently changing remote avatars.
    minimumCacheTTL: 60,
    // Allow the quality values used by avatar/image components.
    qualities: [75, 90],
    // Prevent very large remote images from consuming too much memory in optimization.
    maximumResponseBody: 10_000_000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/7.x/**",
      },
    ],
  },
  headers: async () => [
    {
      // Prevent browser caching of all HTML pages (they contain auth-dependent content)
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)",
      headers: [
        {
          key: "Cache-Control",
          value: "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
        {
          key: "Pragma",
          value: "no-cache",
        },
        {
          key: "Expires",
          value: "0",
        },
      ],
    },
  ],
};

export default nextConfig;
