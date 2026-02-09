// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ✅ Supabase public objects
      {
        protocol: "https",
        hostname: "tsxjyqfdptctwbekbddk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      // ✅ Vercel avatar (танд 400 өгч байгаа нь энэ)
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
        pathname: "/**",
      },
    ],

    // Хэрвээ avatar SVG буцааж байгаа бол л хэрэгтэй.
    // Хүсэхгүй бол доорх мөрийг битгий нэмээд, avatar дээр unoptimized хэрэглэж болно.
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
