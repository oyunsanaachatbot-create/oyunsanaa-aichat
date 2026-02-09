import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ✅ Supabase public objects
      {
        protocol: "https",
        hostname: "tsxyjqfdptctwbekbddk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      // ✅ (хэрвээ signed url ашигладаг бол)
      {
        protocol: "https",
        hostname: "tsxyjqfdptctwbekbddk.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },

      // ✅ avatar.vercel.sh (таны 400 болж байгаа)
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
