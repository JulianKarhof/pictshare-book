import { mock } from "bun:test";

export const ElementServiceMock = {
  hasProjectAccess: mock((projectId, userId) => {
    if (projectId === "project-1" && userId === "user-1") {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
};
