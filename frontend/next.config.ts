import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Streamdown code plugin (Shiki) — see https://streamdown.ai/docs/plugins/code
  transpilePackages: ["shiki"],
};

export default nextConfig;
