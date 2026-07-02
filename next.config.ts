import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["katex"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
    ],
  },
  // ADD THIS BLOCK TO KILL THE INFINITE TYPE LOOP:
  typescript: {
    // This stops Next.js from automatically generating route types during builds
    tsconfigPath: "tsconfig.json",
  },
  // Next 16: experimental.typedRoutes → top-level typedRoutes болж нүүсэн
  typedRoutes: false,
};

export default nextConfig;
