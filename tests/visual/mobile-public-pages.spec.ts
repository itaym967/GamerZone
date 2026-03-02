import { expect, type Page, test } from "@playwright/test";

async function preparePage(page: Page, path: string) {
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
}

test.describe("mobile public pages", () => {
  test("home", async ({ page }) => {
    await preparePage(page, "/");
    const mask = [
      page.locator("section").nth(0),
      page.locator("section").nth(1),
    ];
    await expect(page).toHaveScreenshot("home.png", { fullPage: true, mask });
  });

  test("login", async ({ page }) => {
    await preparePage(page, "/login");
    await expect(page).toHaveScreenshot("login.png", { fullPage: true });
  });

  test("signup", async ({ page }) => {
    await preparePage(page, "/signup");
    await expect(page).toHaveScreenshot("signup.png", { fullPage: true });
  });

  test("forgot-password", async ({ page }) => {
    await preparePage(page, "/forgot-password");
    await expect(page).toHaveScreenshot("forgot-password.png", {
      fullPage: true,
    });
  });

  test("parental-consent-success", async ({ page }) => {
    await preparePage(page, "/parental-consent/success");
    await expect(page).toHaveScreenshot("parental-consent-success.png", {
      fullPage: true,
    });
  });
});
