import { auth } from "@api/auth";
import Elysia from "elysia";

export const authMacro = new Elysia().macro({
  isAuth: {
    async resolve({ request, error }) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return error(401, "Unauthorized");
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
