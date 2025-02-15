import { t } from "elysia";

export const Common400ErrorSchema = t.Object({
  message: t.String({ examples: ["Bad Request"] }),
});

export const Common404ErrorSchema = t.Object({
  message: t.String({ examples: ["Not Found"] }),
});

export const CommonSuccessMessageSchema = t.Object({
  message: t.String({ examples: ["Success"] }),
});

export const Common401ErrorSchema = t.Object({
  message: t.String({ examples: ["Unauthorized"] }),
});
