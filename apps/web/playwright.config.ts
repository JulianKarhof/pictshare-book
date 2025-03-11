import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  snapshotPathTemplate: "./tests/snaps/{testFilePath}/{arg}{ext}",
  workers: 1,
  timeout: isCI ? 1000 * 60 : 1000 * 30,
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
      dependencies: ["setup db"],
      teardown: "cleanup db",
    },
    {
      name: "setup db",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "cleanup db",
      testMatch: /global\.teardown\.ts/,
    },
  ],
  expect: {
    timeout: isCI ? 1000 * 30 : 1000 * 5,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      stylePath: "./tests/hide-ui.css",
    },
  },
  use: {
    baseURL: "http://localhost:3001",
    screenshot: isCI ? "off" : "on",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "bun run dev",
      timeout: 120 * 1000,
      reuseExistingServer: !isCI,
      stdout: "pipe",
      url: "http://localhost:3001",
      env: {
        NEXT_PUBLIC_IS_TEST: "true",
        PORT: "3001",
        NEXT_PUBLIC_BACKEND_URL: "http://localhost:4001",
      },
    },
    {
      command: "bun run dev",
      cwd: "../api",
      timeout: 120 * 1000,
      reuseExistingServer: !isCI,
      stdout: "pipe",
      url: "http://localhost:4001/docs",
      env: {
        NODE_ENV: "test",
        PORT: "4001",
        DATABASE_URL:
          "postgresql://postgres:postgres@localhost:5434/postgres?schema=test",
        FRONTEND_URL: "http://localhost:3001",
        BETTER_AUTH_SECRET: "test",
        BETTER_AUTH_URL: "http://localhost:4001/auth",
        S3_ENDPOINT: "http://localhost:9000",
        S3_BUCKET_NAME: "test",
      },
    },
  ],
  forbidOnly: !!process.env.CI,
  retries: isCI ? 2 : 0,
  reporter: [["html"], isCI ? ["github"] : ["list"]],
});
