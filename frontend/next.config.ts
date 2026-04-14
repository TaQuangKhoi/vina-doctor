import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Required for minimal Docker image via .next/standalone output
  output: "standalone",
};

export default nextConfig;
