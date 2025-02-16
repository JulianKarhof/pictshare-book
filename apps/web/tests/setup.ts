import { PrismaClient } from "@prisma/client";

export const setupDb = async (client?: PrismaClient) => {
  console.log("seeding database...");

  const prisma = client || new PrismaClient();

  await prisma.user.create({
    data: createUser(
      "one",
      "352605e90b41150d31460e23a6f52529:97d34ddb0470a81f57b42e891987f264903b62e76c0a6f72c76d4c8ea537ccafbb7b796a6073aeb1b9c163152f7ec43f1360ebe27f17f4d80f4f15f104c81b62",
    ),
  });
  await prisma.user.create({
    data: createUser(
      "two",
      "6d54e8c5adf08b475848ff59c6164256:31df571035712e3509ba9c6af41f8d52832a8324f09de0eee8b5c0491575e17925ed8bc33e2d3a9ffdb5a261e2515afcaa206e44f9045b4bf7b4486c89e57cac",
    ),
  });

  await prisma.project.create({
    data: {
      id: "test_project_id",
      name: "Test Project",
      elements: {
        create: [
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
            shape: {
              create: {
                shapeType: "RECTANGLE",
                fill: 13344240,
                stroke: 16777215,
                strokeWidth: 1,
                points: [],
              },
            },
            createdAt: "2025-02-02T13:55:59.948Z",
            updatedAt: "2025-02-07T07:42:05.329Z",
          },
        ],
      },
      members: {
        create: [
          {
            role: "OWNER",
            user: {
              connect: {
                id: "test_user_id_one",
              },
            },
          },
          {
            role: "EDITOR",
            user: {
              connect: {
                id: "test_user_id_two",
              },
            },
          },
        ],
      },
    },
  });

  console.log("seeding database complete");
};

const createUser = (suffix: string, password: string) => {
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
        password: password,
        providerId: "credential",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    sessions: {
      create: {
        id: `test_session_id_${suffix}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        token: `test_${suffix}_token`,
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    },
  };
};
