import { expect, test } from "@playwright/test";

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

test.describe("Canvas interaction tests", () => {
  test("should test two canvases interacting via ws", async ({ browser }) => {
    const one = await browser.newContext();
    const two = await browser.newContext();

    const pageOne = await one.newPage();
    const pageTwo = await two.newPage();

    await pageOne.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: mockElements });
    });
    await pageTwo.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: mockElements });
    });

    await pageOne.goto(`http://localhost:3000/${projectId}`);
    await pageTwo.goto(`http://localhost:3000/${projectId}`);

    const canvasOne = pageOne.locator("canvas");
    await expect(canvasOne).toBeVisible();
    const canvasTwo = pageTwo.locator("canvas");
    await expect(canvasTwo).toBeVisible();

    await pageOne.waitForLoadState("networkidle");
    await pageTwo.waitForLoadState("networkidle");
    await expect(pageOne).toHaveScreenshot("one-first-load.png");
    await expect(pageTwo).toHaveScreenshot("two-first-load.png");

    await pageOne.mouse.move(100, 100);
    await pageOne.mouse.down();
    await pageOne.mouse.move(100, 200);
    await pageOne.waitForTimeout(100);
    await pageOne.mouse.up();
    await pageOne.mouse.click(0, 0);
    await pageTwo.waitForLoadState("networkidle");

    await expect(pageOne).toHaveScreenshot("one-after-move.png");
    await expect(pageTwo).toHaveScreenshot("one-after-move.png");

    await pageTwo.mouse.move(100, 200);
    await pageTwo.mouse.down();
    await pageTwo.mouse.move(200, 200);
    await pageTwo.waitForTimeout(100);
    await pageTwo.mouse.up();
    await pageTwo.mouse.click(0, 0);
    await pageOne.waitForLoadState("networkidle");

    await expect(pageOne).toHaveScreenshot("two-after-move.png");
    await expect(pageTwo).toHaveScreenshot("two-after-move.png");

    await one.close();
    await two.close();
  });

  test("should create a new square", async ({ page }) => {
    await page.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.goto(`http://localhost:3000/${projectId}`);

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

  test("should create a new circle", async ({ page }) => {
    await page.route(`**/projects/*/elements`, async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.goto(`http://localhost:3000/${projectId}`);

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
