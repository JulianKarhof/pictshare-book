import { ElementType, ShapeType } from "@prisma/client";
import { t } from "elysia";

export const ElementBaseSchema = t.Object({
  id: t.String({
    examples: ["cljk3d4g50000pb56j8qhm8nz"],
  }),
  projectId: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
  type: t.Enum(ElementType, { examples: [ElementType.IMAGE] }),
  x: t.Number({ examples: [100] }),
  y: t.Number({ examples: [100] }),
  width: t.Number({ examples: [100] }),
  height: t.Number({ examples: [100] }),
  scaleX: t.Number({ examples: [1] }),
  scaleY: t.Number({ examples: [1] }),
  angle: t.Number({ examples: [0] }),
  zIndex: t.Number({ examples: [0] }),
  createdAt: t.Date({
    examples: ["2025-08-01T00:00:00.000Z"],
    format: "date-time",
  }),
  updatedAt: t.Date({
    examples: ["2025-08-01T00:00:00.000Z"],
    format: "date-time",
  }),
});

const ImageSchema = t.Object({
  id: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
  url: t.String({ examples: ["https://example.com/image.jpg"], format: "uri" }),
  elementId: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
});

const ImageCreateSchema = t.Omit(ImageSchema, ["id", "elementId"]);

const TextSchema = t.Object({
  id: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
  content: t.String({ examples: ["Hello World"] }),
  fontSize: t.Number({ examples: [16] }),
  fontFamily: t.Optional(t.Nullable(t.String({ examples: ["Arial"] }))),
  color: t.Optional(t.Nullable(t.Number({ examples: [0x000000] }))),
  elementId: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
});

const TextCreateSchema = t.Omit(TextSchema, ["id", "elementId"]);

const ShapeSchema = t.Object({
  id: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
  shapeType: t.Enum(ShapeType),
  fill: t.Nullable(t.Number({ examples: [0xff0000] })),
  stroke: t.Nullable(t.Number({ examples: [0x000000] })),
  strokeWidth: t.Nullable(t.Number({ examples: [2] })),
  points: t.Array(t.Number(), { examples: [[0, 0, 100, 100]] }),
  elementId: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
});

const ShapeCreateSchema = t.Omit(ShapeSchema, ["id", "elementId"]);

export const ElementSchema = t.Composite([
  ElementBaseSchema,
  t.Object({
    image: t.Nullable(ImageSchema),
    text: t.Nullable(TextSchema),
    shape: t.Nullable(ShapeSchema),
  }),
]);

export const ElementCreateSchema = t.Composite([
  t.Omit(ElementBaseSchema, ["id", "createdAt", "updatedAt"]),
  t.Object({
    projectId: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
    image: t.Optional(ImageCreateSchema),
    text: t.Optional(TextCreateSchema),
    shape: t.Optional(ShapeCreateSchema),
  }),
]);
