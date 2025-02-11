import { App } from "@api/index";
import { treaty } from "@elysiajs/eden";
import env from "@web/util/env";

export const client = treaty<App>(env.BACKEND_URL);
