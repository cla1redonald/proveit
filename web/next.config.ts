import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly using Node.js runtime for API routes (not Edge)
  // The Anthropic SDK requires Node.js built-ins
  // This is the default but explicit is better than implicit
};

export default nextConfig;
