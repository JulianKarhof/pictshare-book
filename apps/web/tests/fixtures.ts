import { APIRequestContext, Page, test as base } from "@playwright/test";

type Fixtures = {
  loggedInPage: Page;
  one: Page;
  two: Page;
};

const loginUser = async (request: APIRequestContext, email: string) => {
  const response = await request.post(
    "http://localhost:4001/auth/sign-in/email",
    {
      data: {
        email,
        password: "password",
      },
    },
  );

  return response
    .headers()
    ["set-cookie"].split("; ")
    .find((cookie) => cookie.startsWith("pctsh-book-test.session_token="))
    ?.split("=")?.[1];
};

export const test = base.extend<Fixtures>({
  loggedInPage: async ({ page, request }, use) => {
    const token = await loginUser(request, "test_one@user.com");

    if (!token) {
      throw new Error("Failed to login");
    }

    page.context().addCookies([
      {
        name: "pctsh-book-test.session_token",
        value: token,
        url: "http://localhost",
      },
    ]);

    await use(page);

    await page.context().clearCookies();
  },
  one: async ({ browser, request }, use) => {
    const context = await browser.newContext();
    const one = await context.newPage();

    const token = await loginUser(request, "test_one@user.com");

    if (!token) {
      throw new Error("Failed to login");
    }

    one.context().addCookies([
      {
        name: "pctsh-book-test.session_token",
        value: token,
        url: "http://localhost",
      },
    ]);

    await use(one);

    await context.close();
  },
  two: async ({ browser, request }, use) => {
    const context = await browser.newContext();
    const two = await context.newPage();

    const token = await loginUser(request, "test_two@user.com");

    if (!token) {
      throw new Error("Failed to login");
    }

    two.context().addCookies([
      {
        name: "pctsh-book-test.session_token",
        value: token,
        url: "http://localhost",
      },
    ]);

    await use(two);

    await context.close();
  },
});

export { expect } from "@playwright/test";
