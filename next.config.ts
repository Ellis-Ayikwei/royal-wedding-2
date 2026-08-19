import type { NextConfig } from "next";

// Read directly rather than through src/lib/storage.ts: next.config.ts loads before
// the rest of the app and must stay a plain Node script, not pull in app code.
const r2PublicHost = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2PublicHost ? [{ protocol: "https", hostname: r2PublicHost }] : [],
  },
};

export default nextConfig;
