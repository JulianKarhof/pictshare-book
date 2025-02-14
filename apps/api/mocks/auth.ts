import { mock } from "bun:test";

export const authMocks = {
  api: {
    getSession: mock(() => {
      return {
        session: {
          id: "test-session-id",
          token: "gZi3FToPB8eYKkDdqOYab6u973PhBcmr",
          userId: "test-user-id",
        },
        user: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          emailVerified: true,
        },
      };
    }),
  },
};
