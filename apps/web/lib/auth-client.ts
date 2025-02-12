import env from "@web/lib/env";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.BACKEND_URL,
});
