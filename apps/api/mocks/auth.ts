import { mock } from "bun:test";
import { mockUsers } from "./user";

export const authMocks = {
  api: {
    getSession: mock(() => {
      return {
        session: {
          id: "test-session-id",
          token: "gZi3FToPB8eYKkDdqOYab6u973PhBcmr",
          userId: mockUsers[0].id,
        },
        user: mockUsers[0],
      };
    }),
  },
};
