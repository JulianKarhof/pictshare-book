import { PrismaClient } from "@prisma/client";

export const tearDownDb = async (client?: PrismaClient) => {
  console.log("tearing down database...");

  const prisma = client || new PrismaClient();

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='test'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"test"."${name}"`)
    .join(", ");

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }

  console.log("tearing down database complete");
};
