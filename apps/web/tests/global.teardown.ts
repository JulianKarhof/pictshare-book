import { test as teardown } from "@playwright/test";
import { tearDownDb } from "./teardown";

teardown("tear down database", async () => {
  await tearDownDb();
});
