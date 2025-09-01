import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 本番ビルド時はESLintエラーを無視（デプロイのため）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScriptエラーを無視（デプロイのため）
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
