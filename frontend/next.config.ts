import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  // Streamdown code plugin (Shiki) — see https://streamdown.ai/docs/plugins/code
  transpilePackages: ["shiki"],
};

export default withNextIntl(nextConfig);
