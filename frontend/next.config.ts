import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  typescript: {
    // ✅ Ignores TypeScript errors during production builds
    // (Build will succeed even with TS errors)
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: "C:\\Users\\addy\\Pictures\\flexoraa-new backuo",
  },
};

export default nextConfig;
