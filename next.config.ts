import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  transpilePackages: ["@auth/prisma-adapter", "@auth/core"],
};

export default nextConfig;
