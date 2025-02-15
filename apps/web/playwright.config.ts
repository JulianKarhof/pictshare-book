import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  timeout: 1000 * 60,
  snapshotPathTemplate: "./tests/snaps/{testFilePath}/{arg}{ext}",
  workers: 1,
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
      dependencies: ["setup db"],
    },
    {
      name: "setup db",
      testMatch: /global\.setup\.ts/,
      teardown: "cleanup db",
    },
    {
      name: "cleanup db",
      testMatch: /global\.teardown\.ts/,
    },
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.006,
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
      port: 3001,
      timeout: 120 * 1000,
      reuseExistingServer: !isCI,
      env: {
        NODE_ENV: "test",
        PORT: "3001",
        NEXT_PUBLIC_BACKEND_URL: "http://localhost:4001",
      },
    },
    {
      command: "bun run dev",
      cwd: "../api",
      port: 4001,
      timeout: 120 * 1000,
      reuseExistingServer: !isCI,
      env: {
        NODE_ENV: "test",
        PORT: "4001",
        DATABASE_URL:
          "postgresql://postgres:postgres@localhost:5434/postgres?schema=test",
        FRONTEND_URL: "http://localhost:3001",
        BETTER_AUTH_SECRET: "test",
        BETTER_AUTH_URL: "http://localhost:4001/auth",
      },
    },
  ],
  forbidOnly: !!process.env.CI,
  retries: isCI ? 2 : 0,
  reporter: [["html"], isCI ? ["github"] : ["list"]],
});
