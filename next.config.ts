import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Bundle analyzer — enabled via ANALYZE=true environment variable
const withBundleAnalyzer = process.env.ANALYZE === "true"
  ? require("@next/bundle-analyzer")({ enabled: true })
  : (config: NextConfig) => config;

export default withBundleAnalyzer(nextConfig);
