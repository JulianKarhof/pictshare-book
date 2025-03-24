import env from "@api/env";
import prisma from "@api/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
  trustedOrigins: [env.FRONTEND_URL, "book.pict.sh"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    cookiePrefix: `pctsh-book-${env.PICTSHARE_BOOK_ENV}`,
    crossSubDomainCookies: {
      enabled: true,
      domain:
        process.env.NODE_ENV === "production" ? "book.pict.sh" : "localhost",
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const members = await prisma.member.findMany({
        where: {
          userId: user.id,
        },
      });

      return {
        members,
        user,
        session,
      };
    }),
  ],
});
