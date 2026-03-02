import { expect, type Locator, type Page, test } from "@playwright/test";

const AUTH_ROUTES = [
  { path: "/profile", screenshot: "auth-profile.png" },
  { path: "/friends", screenshot: "auth-friends.png" },
  { path: "/chat", screenshot: "auth-chat.png" },
  { path: "/notifications", screenshot: "auth-notifications.png" },
  { path: "/lfg", screenshot: "auth-lfg.png" },
] as const;
const LOGIN_URL_REGEX = /\/login(?:$|[/?])/;

function getCommonMasks(page: Page): Locator[] {
  return [
    page.locator("[data-sonner-toaster]"),
    page.locator(".animate-pulse"),
    page.locator("time"),
  ];
}

async function prepareAuthedPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }
    `,
  });
  await expect(page).not.toHaveURL(LOGIN_URL_REGEX);
}

test.describe("mobile authenticated pages", () => {
  for (const route of AUTH_ROUTES) {
    test(route.path, async ({ page }) => {
      await prepareAuthedPage(page, route.path);
      await expect(page).toHaveScreenshot(route.screenshot, {
        mask: getCommonMasks(page),
      });
    });
  }
});
