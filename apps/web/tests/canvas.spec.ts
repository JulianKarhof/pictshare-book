import { expect } from "@playwright/test";
import { test } from "./fixtures";

const mockElements = [
  {
    id: "cm6noq7nw0000wqflkyve98no",
    type: "SHAPE",
    x: 500,
    y: 500,
    width: 200,
    height: 200,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    zIndex: 0,
    createdAt: "2025-02-02T13:55:59.948Z",
    updatedAt: "2025-02-07T07:42:05.329Z",
    shapeType: "RECTANGLE",
    fill: 13344240,
    stroke: 16777215,
    strokeWidth: 1,
    points: [],
  },
];

const projectId = "cm6jiuf6j0000wqk76ooxu0oz";

test.describe("Canvas", () => {
  test("should test two canvases interacting via ws", async ({ one, two }) => {
    await one.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: mockElements });
    });
    await two.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: mockElements });
    });

    await one.goto(`http://localhost:3001/${projectId}`);
    await two.goto(`http://localhost:3001/${projectId}`);

    const canvasOne = one.locator("canvas");
    await expect(canvasOne).toBeVisible();
    const canvasTwo = two.locator("canvas");
    await expect(canvasTwo).toBeVisible();

    await one.waitForLoadState("networkidle");
    await two.waitForLoadState("networkidle");
    await expect(one).toHaveScreenshot("one-first-load.png");
    await expect(two).toHaveScreenshot("two-first-load.png");

    await one.mouse.move(100, 100);
    await one.mouse.down();
    await one.mouse.move(100, 200);
    await one.waitForTimeout(100);
    await one.mouse.up();
    await one.mouse.click(0, 0);
    await two.waitForLoadState("networkidle");

    await expect(one).toHaveScreenshot("one-after-move.png");
    await expect(two).toHaveScreenshot("one-after-move.png");

    await two.mouse.move(100, 200);
    await two.mouse.down();
    await two.mouse.move(200, 200);
    await two.waitForTimeout(100);
    await two.mouse.up();
    await two.mouse.click(0, 0);
    await one.waitForLoadState("networkidle");

    await expect(one).toHaveScreenshot("two-after-move.png");
    await expect(two).toHaveScreenshot("two-after-move.png");

    await one.close();
    await two.close();
  });

  test("should create a new square", async ({ loggedInPage: page }) => {
    await page.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.goto(`http://localhost:3001/${projectId}`);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    await page.waitForLoadState("networkidle");

    const request = page.waitForRequest((request) => {
      const isPost = request.method() === "POST";
      const isElementsUrl = request.url().includes("/elements");
      const isSquare = request.postDataJSON()?.shapeType === "RECTANGLE";

      return isPost && isElementsUrl && isSquare;
    });

    await expect(page).toHaveScreenshot("before-add-square.png");

    await page.click("text=Square");
    await request;
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot("after-add-square.png");
  });

  test("should create a new circle", async ({ loggedInPage: page }) => {
    await page.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.goto(`http://localhost:3001/${projectId}`);

    const request = page.waitForRequest((request) => {
      const isPost = request.method() === "POST";
      const isElementsUrl = request.url().includes("/elements");
      const isSquare = request.postDataJSON()?.shapeType === "CIRCLE";

      return isPost && isElementsUrl && isSquare;
    });

    await expect(page).toHaveScreenshot("before-add-circle.png");

    await page.click("text=Circle");
    await request;
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot("after-add-circle.png");
  });
});
