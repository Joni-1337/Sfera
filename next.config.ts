import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Нужно для ONREZA / Docker / self-host; на Vercel тоже ок
  output: "standalone",
};

export default nextConfig;
