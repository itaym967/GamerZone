import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.VISUAL_BASE_URL ?? "https://gamer-zone-sigma.vercel.app";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
      scale: "css",
    },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-iphone13",
      use: {
        browserName: "chromium",
        ...devices["iPhone 13"],
      },
    },
    {
      name: "mobile-pixel7",
      use: {
        browserName: "chromium",
        ...devices["Pixel 7"],
      },
    },
  ],
});
