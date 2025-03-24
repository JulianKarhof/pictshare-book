import { mock } from "bun:test";
import { Role } from "@prisma/client";

export const AuthServiceMock = {
  hasProjectAccess: mock((projectId, userId) => {
    if (projectId === "project-1" && userId === "user-1") {
      return Promise.resolve(Role.OWNER);
    }
    if (projectId === "project-2" && userId === "user-2") {
      return Promise.resolve(Role.OWNER);
    }
    return Promise.resolve(null);
  }),
};
