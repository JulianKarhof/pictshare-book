import env from "@web/lib/env";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: `${env.BACKEND_URL}/auth`,
});

export const { signIn, signOut, signUp, useSession } = authClient;
