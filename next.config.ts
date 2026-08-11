import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      // Default is 1MB — too small for the admin tour editor's image
      // uploads (lib/actions/uploads.ts caps individual files at 8MB).
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      // Admin-uploaded tour photos (lib/actions/uploads.ts).
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/v0/b/**" },
      // Placeholder stock photography used when a tour has no uploaded image yet.
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
