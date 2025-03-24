import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.describe("Project", () => {
  test("should create a new project", async ({ loggedInPage: page }) => {
    await page.goto("/");

    await page.getByTestId("new-book-button").click();
    await page.getByTestId("book-title-input").fill("New Test Book");
    await page.getByTestId("create-book-submit").click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("book-name").last()).toHaveText(
      "New Test Book",
    );
  });

  test("should delete a project", async ({ loggedInPage: page }) => {
    await page.goto("/");

    const project = page
      .getByTestId("book-card")
      .filter({ has: page.getByText("Test Project") });

    await expect(project).toBeVisible();

    await project.getByTestId("book-details-button").last().click();
    await page.getByTestId("delete-book-button").last().click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Test Project")).toHaveCount(0);
  });
});
