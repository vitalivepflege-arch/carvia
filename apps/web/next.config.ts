import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@carvia/ui",
    "@carvia/domain",
    "@carvia/providers",
    "@carvia/database"
  ]
};

export default nextConfig;
