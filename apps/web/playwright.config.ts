import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  timeout: 1000 * 60,
  snapshotPathTemplate: "./tests/snaps/{testFilePath}/{arg}{ext}",
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.006,
    },
  },
  use: {
    baseURL: "http://localhost:3000",
    screenshot: isCI ? "off" : "on",
    trace: "on-first-retry",
  },
  forbidOnly: !!process.env.CI,
  retries: isCI ? 2 : 0,
  reporter: [["html"], isCI ? ["github"] : ["list"]],
});
