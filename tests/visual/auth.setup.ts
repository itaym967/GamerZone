import { access, copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { type Browser, expect, test as setup } from "@playwright/test";

const AUTH_STATE_PATH = "tests/.auth/user.json";
const BASE_URL =
  process.env.VISUAL_BASE_URL ?? "https://gamer-zone-sigma.vercel.app";
const FALLBACK_AUTH_STATE_PATH =
  process.env.VISUAL_TEST_AUTH_STATE_PATH ?? "dogfood-output/auth-state.json";

type FallbackAuthStateResult = "invalid" | "missing" | "valid";

async function tryFallbackAuthState(
  browser: Browser
): Promise<FallbackAuthStateResult> {
  try {
    await access(FALLBACK_AUTH_STATE_PATH);
    await mkdir(dirname(AUTH_STATE_PATH), { recursive: true });
    await copyFile(FALLBACK_AUTH_STATE_PATH, AUTH_STATE_PATH);
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle" });
    const isAuthenticated = !new URL(page.url()).pathname.startsWith("/login");
    await context.close();
    return isAuthenticated ? "valid" : "invalid";
  } catch {
    return "missing";
  }
}

setup("authenticate for mobile visual tests", async ({ page, browser }) => {
  const email = process.env.VISUAL_TEST_EMAIL;
  const password = process.env.VISUAL_TEST_PASSWORD;

  if (!(email && password)) {
    throw new Error(
      "VISUAL_TEST_EMAIL and VISUAL_TEST_PASSWORD are required for authenticated visual tests."
    );
  }

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  await page.goto("/profile", { waitUntil: "networkidle" });

  const currentPath = new URL(page.url()).pathname;
  if (currentPath.startsWith("/login")) {
    const fallbackResult = await tryFallbackAuthState(browser);
    if (fallbackResult === "valid") {
      return;
    }
    const inlineError = await page.getByRole("alert").first().textContent();
    throw new Error(
      `Authenticated setup failed. Login stayed on /login. Inline error: ${inlineError ?? "none"}. Fallback auth state (${FALLBACK_AUTH_STATE_PATH}) status: ${fallbackResult}.`
    );
  }

  await expect(page.getByText("הפרופיל שלי").first()).toBeVisible({
    timeout: 15_000,
  });

  await mkdir(dirname(AUTH_STATE_PATH), { recursive: true });
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
