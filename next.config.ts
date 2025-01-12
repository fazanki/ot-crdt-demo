import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    WS_URL: process.env.WS_URL || "ws://localhost:8080",
  },
  /* config options here */
};

export default nextConfig;
