import { auth } from "@api/auth";
import { type Context, Elysia } from "elysia";

const betterAuthView = async (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  } else {
    context.error(405);
  }
};

const authRoute = new Elysia().all("/auth/*", betterAuthView);

export default authRoute;
