import { Role } from "@prisma/client";
import { ElementSchema } from "@routes/element/element.schema";
import { t } from "elysia/type-system";

export const MemberSchema = t.Object({
  userId: t.String({
    examples: ["cljk3d4g50000pb56j8qhm8nz"],
  }),
  projectId: t.String({
    examples: ["cljk3d4g50000pb56j8qhm8nz"],
  }),
  email: t.String({
    examples: ["user@example.com"],
    format: "email",
  }),
  role: t.Enum(Role),
});

export const MemberCreateSchema = t.Pick(MemberSchema, ["email", "role"]);

export const ProjectSchema = t.Object({
  id: t.String({
    examples: ["cljk3d4g50000pb56j8qhm8nz"],
  }),
  name: t.String({ examples: ["My Project"], minLength: 3, maxLength: 100 }),
  createdAt: t.Date({ examples: ["2025-09-30T10:00:00.000Z"] }),
  updatedAt: t.Date({ examples: ["2025-09-30T10:00:00.000Z"] }),
});

export const ProjectWithIncludesSchema = t.Intersect([
  t.Object({
    members: t.Array(MemberSchema),
    elements: t.Array(ElementSchema),
  }),
  t.Omit(ProjectSchema, ["elements"]),
]);

export const ProjectCreateSchema = t.Pick(ProjectSchema, ["name"]);
