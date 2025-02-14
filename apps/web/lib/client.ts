import { App } from "@api/index";
import { treaty } from "@elysiajs/eden";
import env from "@web/lib/env";

export const client = treaty<App>(env.BACKEND_URL, {
  fetch: {
    credentials: "include",
  },
});
