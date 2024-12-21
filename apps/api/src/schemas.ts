import { t } from "elysia";

export const Common404ErrorSchema = t.Object({
  message: t.String({ examples: ["Not Found"] }),
});

export const CommonSuccessMessageSchema = t.Object({
  message: t.String({ examples: ["Success"] }),
});
