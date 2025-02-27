import { t } from "elysia/type-system";

export enum ElementType {
  IMAGE = "IMAGE",
  TEXT = "TEXT",
  CIRCLE = "CIRCLE",
  RECTANGLE = "RECTANGLE",
}

const ElementBaseSchema = t.Object({
  id: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
  x: t.Number({ examples: [100] }),
  y: t.Number({ examples: [100] }),
  width: t.Number({ examples: [100] }),
  height: t.Number({ examples: [100] }),
  scaleX: t.Number({ examples: [1] }),
  scaleY: t.Number({ examples: [1] }),
  angle: t.Number({ examples: [0] }),
  zIndex: t.Number({ examples: [0] }),
  createdAt: t.Optional(
    t.Date({
      examples: ["2025-08-01T00:00:00.000Z"],
      format: "date-time",
    }),
  ),
  updatedAt: t.Optional(
    t.Date({
      examples: ["2025-08-01T00:00:00.000Z"],
      format: "date-time",
    }),
  ),
});

export const ImageElementSchema = t.Composite([
  ElementBaseSchema,
  t.Object({
    type: t.Literal(ElementType.IMAGE),
    assetId: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
  }),
]);

export const TextElementSchema = t.Composite([
  ElementBaseSchema,
  t.Object({
    type: t.Literal(ElementType.TEXT),
    content: t.String({ examples: ["Hello World"] }),
    fontSize: t.Number({ examples: [16] }),
    fontFamily: t.Optional(t.Nullable(t.String({ examples: ["Arial"] }))),
    color: t.Optional(t.Nullable(t.Number({ examples: [0x000000] }))),
  }),
]);

export const CircleElementSchema = t.Composite([
  ElementBaseSchema,
  t.Object({
    angle: t.Number({ examples: [0] }),
    type: t.Literal(ElementType.CIRCLE),
    fill: t.Nullable(t.Number({ examples: [0xff0000] })),
    stroke: t.Nullable(t.Number({ examples: [0x000000] })),
    strokeWidth: t.Nullable(t.Number({ examples: [2] })),
  }),
]);

export const RectangleElementSchema = t.Composite([
  ElementBaseSchema,
  t.Object({
    type: t.Literal(ElementType.RECTANGLE),
    width: t.Number({ examples: [100] }),
    height: t.Number({ examples: [50] }),
    fill: t.Nullable(t.Number({ examples: [0xff0000] })),
    stroke: t.Nullable(t.Number({ examples: [0x000000] })),
    strokeWidth: t.Nullable(t.Number({ examples: [2] })),
    cornerRadius: t.Nullable(t.Number({ examples: [10] })),
  }),
]);

export const ElementSchema = t.Union([
  ImageElementSchema,
  TextElementSchema,
  CircleElementSchema,
  RectangleElementSchema,
]);

export const ElementCreateSchema = t.Omit(ElementSchema, [
  "id",
  "createdAt",
  "updatedAt",
  "projectId",
]);

export const ElementUpdateSchema = t.Union([
  t.Intersect([
    t.Pick(ElementSchema, ["type"]),
    t.Partial(t.Omit(ElementSchema, ["id"])),
  ]),
]);

export const ElementUpsertSchema = t.Omit(ElementSchema, [
  "createdAt",
  "updatedAt",
  "projectId",
]);
