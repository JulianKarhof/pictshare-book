import { mock } from "bun:test";

export const AuthServiceMock = {
  hasProjectAccess: mock((projectId, userId) => {
    if (projectId === "project-1" && userId === "user-1") {
      return Promise.resolve(true);
    }
    if (projectId === "project-2" && userId === "user-2") {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
};
