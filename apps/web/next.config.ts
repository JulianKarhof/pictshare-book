import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "build",
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: {
      resolveExtensions: [
        ".mdx",
        ".tsx",
        ".ts",
        ".jsx",
        ".js",
        ".mjs",
        ".json",
        "wgsl",
        "frag",
        "vert",
      ],
      rules: {
        "*.wgsl": {
          loaders: ["raw-loader"],
          as: "*.js",
        },
        "*.frag": {
          loaders: ["raw-loader"],
          as: "*.js",
        },
        "*.vert": {
          loaders: ["raw-loader"],
          as: "*.js",
        },
      },
    },
  },
};

export default nextConfig;
