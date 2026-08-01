import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB — too small for the admin tour editor's image
      // uploads (lib/actions/uploads.ts caps individual files at 8MB).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
