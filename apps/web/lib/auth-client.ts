import { auth } from "@api/auth";
import env from "@web/lib/env";
import { customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: `${env.BACKEND_URL}/auth`,
  plugins: [customSessionClient<typeof auth>()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
