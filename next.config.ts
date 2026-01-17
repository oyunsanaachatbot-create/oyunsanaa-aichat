import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      // ✅ template default
      {
        hostname: "avatar.vercel.sh",
      },

      // ✅ Vercel Blob
      {
        protocol: "https",
        // https://nextjs.org/docs/messages/next-image-unconfigured-host
        hostname: "*.public.blob.vercel-storage.com",
      },

      // ✅ Unsplash (Ebook cards images)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
