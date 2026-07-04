import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client"],
  // Ensure the empty DB template (with pre-seeded admin) is bundled
  // into serverless functions on Vercel
  outputFileTracingIncludes: {
    "/api/**": ["./db/teamhub-empty.db", "./prisma/schema.prisma"],
    "/": ["./db/teamhub-empty.db", "./prisma/schema.prisma"],
  },
};

export default nextConfig;
