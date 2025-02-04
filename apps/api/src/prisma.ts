import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  omit: {
    element: {
      projectId: true,
    },
  },
});

export default prisma;
