import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tsxjyqfdptctwbekbddk.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "tsxjyqfdptctwbekbddk.supabase.co",
        pathname: "/storage/v1/render/image/**",
      },
    ],
  },
};

export default nextConfig;
