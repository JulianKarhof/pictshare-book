import { test } from "@playwright/test";

test.describe("Authentication", () => {
  test("should register an account", async ({ page }) => {
    await page.goto(`/auth/sign-up`);

    await page.getByRole("textbox", { name: "First name" }).fill("Test");
    await page.getByRole("textbox", { name: "Last name" }).fill("User");
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("test@registration.com");
    await page
      .getByRole("textbox", { name: "Password Confirm Password" })
      .fill("password");
    await page
      .getByRole("textbox", { name: "Confirm Password", exact: true })
      .fill("password");
    await page.getByRole("button", { name: "Create an account" }).click();

    await page.waitForURL("/");
  });

  test("should login", async ({ page }) => {
    await page.goto(`/auth/sign-in`);

    await page
      .getByRole("textbox", { name: "Email" })
      .fill("test@registration.com");
    await page.getByRole("textbox", { name: "Password" }).fill("password");
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL("/");
  });
});
