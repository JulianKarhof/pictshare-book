import { mock } from "bun:test";
import { mockUsers } from "./user";

export const AuthMock = {
  api: {
    getSession: mock(() => {
      return {
        session: {
          id: "test-session-id",
          token: "test-token",
          userId: mockUsers[0].id,
        },
        user: mockUsers[0],
      };
    }),
  },
};
