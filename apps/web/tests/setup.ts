import { PrismaClient } from "@prisma/client";

export const setupDb = async (client?: PrismaClient) => {
  console.log("seeding database...");

  const prisma = client || new PrismaClient();

  await prisma.user.create({
    data: createUser("one"),
  });
  await prisma.user.create({
    data: createUser("two"),
  });

  console.log("seeding database complete");
};

const createUser = (suffix: string) => {
  return {
    id: `test_user_id_${suffix}`,
    name: `Test User ${suffix}`,
    email: `test_${suffix}@user.com`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    accounts: {
      create: {
        id: `test_account_id_${suffix}`,
        accountId: `test_account_id_${suffix}`,
        password: `test_password_${suffix}`,
        providerId: "credential",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    sessions: {
      create: {
        id: `test_session_id_${suffix}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        token: `test_token_${suffix}`,
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    },
  };
};
