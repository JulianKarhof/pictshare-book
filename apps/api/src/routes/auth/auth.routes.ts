import { auth } from "@api/auth";
import { type Context, Elysia } from "elysia";

const betterAuthView = async (context: Context) => {
  const betterAuthAcceptMethods = ["POST", "GET"];
  if (betterAuthAcceptMethods.includes(context.request.method)) {
    return auth.handler(context.request);
  } else {
    context.error(405);
  }
};

const authRoute = new Elysia().all("/auth/*", betterAuthView);

export default authRoute;
