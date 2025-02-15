import { auth } from "@api/auth";
import prisma from "@api/prisma";
import Elysia from "elysia";

export const authMacro = new Elysia().macro({
  isAuth: (settings: { fullUser: boolean } | boolean) => ({
    async resolve({ request, error }) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return error(401, "Unauthorized");
      }

      if (typeof settings === "object" && settings.fullUser) {
        const fullUser = await prisma.user.findUnique({
          where: {
            id: session.user.id,
          },
          include: {
            members: {
              include: {
                project: true,
              },
            },
          },
        });

        if (!fullUser) {
          return error(404, "User not found");
        }

        return {
          fullUser: fullUser,
          user: session.user,
          session: session.session,
        };
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  }),
});
