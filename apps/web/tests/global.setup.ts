import { test as setup } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { setupDb } from "./setup";
import { tearDownDb } from "./teardown";

setup("seed database", async () => {
  const prisma = new PrismaClient();
  await tearDownDb(prisma);
  await setupDb(prisma);
});
