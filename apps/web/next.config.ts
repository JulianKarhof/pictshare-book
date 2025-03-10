import type { NextConfig } from "next";
import nextSafe from "next-safe";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  distDir: "build",
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: nextSafe({
          isDev,
          contentSecurityPolicy: {
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "connect-src": [
              "'self'",
              "ws:",
              "wss:",
              "localhost:*",
              "*.pict.sh",
              "data:",
              "https://pictshare-book-staging.fly.storage.tigris.dev",
            ],
            "img-src": [
              "'self'",
              "data:",
              "blob:",
              "localhost:*",
              "*.pict.sh",
              "https://pictshare-book-staging.fly.storage.tigris.dev",
            ],
            "worker-src": ["'self'", "blob:", "localhost:*", "*.pict.sh"],
          },
        }),
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.pict.sh",
      },
      {
        protocol: "https",
        hostname: "**.fly.storage.tigris.dev",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
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
