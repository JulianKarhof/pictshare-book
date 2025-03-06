import { t } from "elysia";

export const Common400ErrorSchema = t.Object({
  message: t.String({ examples: ["Bad Request"] }),
});

export const Common403ErrorSchema = t.Object({
  message: t.String({ examples: ["Forbidden"] }),
});

export const Common404ErrorSchema = t.Object({
  message: t.String({ examples: ["Not Found"] }),
});

export const Common409ErrorSchema = t.Object({
  message: t.String({ examples: ["Conflict"] }),
});

export const CommonSuccessMessageSchema = t.Object({
  message: t.String({ examples: ["Success"] }),
});

export const Common401ErrorSchema = t.Object({
  message: t.String({ examples: ["Unauthorized"] }),
});
