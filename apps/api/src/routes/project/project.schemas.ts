import { ElementSchema } from "@routes/element/element.schema.js";
import { t } from "elysia";

export const ProjectSchema = t.Object({
  id: t.String({
    examples: ["cljk3d4g50000pb56j8qhm8nz"],
  }),
  name: t.String({ examples: ["My Project"], minLength: 5, maxLength: 100 }),
  elements: t.Array(ElementSchema),
  createdAt: t.Date({ examples: ["2025-09-30T10:00:00.000Z"] }),
  updatedAt: t.Date({ examples: ["2025-09-30T10:00:00.000Z"] }),
});

export const ProjectWithoutElementsSchema = t.Omit(ProjectSchema, ["elements"]);
