import { withSentryConfig } from "@sentry/nextjs";
import env from "@web/lib/env";
import type { NextConfig } from "next";
import nextSafe from "next-safe";

const isDev = process.env.NODE_ENV !== "production";
const isTest = process.env.NEXT_PUBLIC_IS_TEST === "true";

const nextConfig: NextConfig = {
  distDir: isTest ? "build_test" : "build",
  devIndicators: false,
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
              "https://pictshare-book-prod.fly.storage.tigris.dev",
              "*.sentry.io",
            ],
            "img-src": [
              "'self'",
              "data:",
              "blob:",
              "localhost:*",
              "*.pict.sh",
              "https://pictshare-book-staging.fly.storage.tigris.dev",
              "https://pictshare-book-prod.fly.storage.tigris.dev",
              "https://cdn.jsdelivr.net",
            ],
            "worker-src": ["'self'", "blob:", "localhost:*", "*.pict.sh"],
            "report-uri": `https://o4508958935089152.ingest.de.sentry.io/api/4508959034114128/security/?sentry_key=40aea8f571a3f3894ddb37cb9eec7607&sentry_environment=${env.NEXT_PUBLIC_SENTRY_ENVIRONMENT}`,
            "report-to": `https://o4508958935089152.ingest.de.sentry.io/api/4508959034114128/security/?sentry_key=40aea8f571a3f3894ddb37cb9eec7607&sentry_environment=${env.NEXT_PUBLIC_SENTRY_ENVIRONMENT}`,
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
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
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

export default withSentryConfig(nextConfig, {
  org: "juliankarhof",
  project: "pictshare-book-web",
  silent: true,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  disableLogger: true,
  automaticVercelMonitors: true,
});
