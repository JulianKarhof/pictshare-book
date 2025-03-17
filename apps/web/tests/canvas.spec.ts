import { expect } from "@playwright/test";
import { test } from "./fixtures";

const projectId = "test_project_id";

test.describe("Canvas", () => {
  test("should test two canvases interacting via ws", async ({ one, two }) => {
    const topLeftClip = { x: 50, y: 50, width: 200, height: 200 };

    await one.goto(`/b/${projectId}`);
    await two.goto(`/b/${projectId}`);

    const canvasOne = one.locator("canvas");
    await expect(canvasOne).toBeVisible();
    const canvasTwo = two.locator("canvas");
    await expect(canvasTwo).toBeVisible();

    await one.waitForLoadState("networkidle");
    await two.waitForLoadState("networkidle");
    await expect(one).toHaveScreenshot("one-first-load.png", {
      clip: topLeftClip,
    });
    await expect(two).toHaveScreenshot("two-first-load.png", {
      clip: topLeftClip,
    });

    await one.mouse.move(100, 100);
    await one.mouse.down();
    await one.mouse.move(100, 200);
    await one.waitForTimeout(100);
    await one.mouse.up();
    await one.mouse.click(0, 0);
    await two.waitForLoadState("networkidle");

    await expect(one).toHaveScreenshot("one-after-first-move.png", {
      clip: topLeftClip,
    });
    await expect(two).toHaveScreenshot("two-after-first-move.png", {
      clip: topLeftClip,
    });

    await two.mouse.move(100, 200);
    await two.mouse.down();
    await two.mouse.move(200, 200);
    await two.waitForTimeout(100);
    await two.mouse.up();
    await two.mouse.click(0, 0);
    await one.waitForLoadState("networkidle");

    await expect(one).toHaveScreenshot("one-after-second-move.png", {
      clip: topLeftClip,
    });
    await expect(two).toHaveScreenshot("two-after-second-move.png", {
      clip: topLeftClip,
    });

    await one.close();
    await two.close();
  });

  const centerClip = {
    x: 1280 / 2 - 100,
    y: 720 / 2 - 100,
    width: 200,
    height: 200,
  };

  test("should create a new square", async ({ loggedInPage: page }) => {
    await page.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.goto(`/b/${projectId}`);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    await page.waitForLoadState("networkidle");

    const request = page.waitForRequest((request) => {
      const isPost = request.method() === "POST";
      const isElementsUrl = request.url().includes("/elements");
      if (!isElementsUrl) return false;
      const isSquare = request.postDataJSON()?.type === "RECTANGLE";

      return isPost && isElementsUrl && isSquare;
    });

    await expect(page).toHaveScreenshot("before-add-square.png", {
      clip: centerClip,
    });

    await page.getByTestId("add-square").click();
    await request;
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot("after-add-square.png", {
      clip: centerClip,
    });
  });

  test("should create a new circle", async ({ loggedInPage: page }) => {
    await page.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.goto(`/b/${projectId}`);

    const request = page.waitForRequest((request) => {
      const isPost = request.method() === "POST";
      const isElementsUrl = request.url().includes("/elements");
      if (!isElementsUrl) return false;
      const isCircle = request.postDataJSON()?.type === "CIRCLE";

      return isPost && isElementsUrl && isCircle;
    });

    await expect(page).toHaveScreenshot("before-add-circle.png", {
      clip: centerClip,
    });

    await page.getByTestId("add-circle").click();
    await request;
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot("after-add-circle.png", {
      clip: centerClip,
    });
  });
});
