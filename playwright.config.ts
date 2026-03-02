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
      name: "setup-auth",
      testMatch: /auth\.setup\.ts/,
      use: {
        browserName: "chromium",
      },
    },
    {
      name: "mobile-iphone13",
      testMatch: /mobile-public-pages\.spec\.ts/,
      use: {
        browserName: "chromium",
        ...devices["iPhone 13"],
      },
    },
    {
      name: "mobile-pixel7",
      testMatch: /mobile-public-pages\.spec\.ts/,
      use: {
        browserName: "chromium",
        ...devices["Pixel 7"],
      },
    },
    {
      name: "mobile-iphone13-auth",
      dependencies: ["setup-auth"],
      testMatch: /mobile-auth-pages\.spec\.ts/,
      use: {
        browserName: "chromium",
        ...devices["iPhone 13"],
        storageState: "tests/.auth/user.json",
      },
    },
    {
      name: "mobile-pixel7-auth",
      dependencies: ["setup-auth"],
      testMatch: /mobile-auth-pages\.spec\.ts/,
      use: {
        browserName: "chromium",
        ...devices["Pixel 7"],
        storageState: "tests/.auth/user.json",
      },
    },
  ],
});
