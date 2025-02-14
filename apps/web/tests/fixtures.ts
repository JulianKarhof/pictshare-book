import { Page, test as base } from "@playwright/test";

type Fixtures = {
  loggedInPage: Page;
  one: Page;
  two: Page;
};

export const test = base.extend<Fixtures>({
  loggedInPage: async ({ page }, use) => {
    page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: "test_token_one",
        url: "http://localhost",
      },
    ]);

    await use(page);

    await page.context().clearCookies();
  },
  one: async ({ page }, use) => {
    page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: "test_token_one",
        url: "http://localhost",
      },
    ]);

    await use(page);

    await page.context().clearCookies();
  },
  two: async ({ page }, use) => {
    page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: "test_token_two",
        url: "http://localhost",
      },
    ]);

    await use(page);

    await page.context().clearCookies();
  },
});

export { expect } from "@playwright/test";
