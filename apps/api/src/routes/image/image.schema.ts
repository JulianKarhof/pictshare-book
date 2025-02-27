import { t } from "elysia/type-system";

const ImageAssetBaseSchema = t.Object({
  id: t.String({ examples: ["cljk3d4g50000pb56j8qhm8nz"] }),
  key: t.String({
    examples: ["proj_123/images/1234567890-abc123.jpg"],
    description: "S3 object key including path",
  }),
  mimeType: t.String({
    examples: ["image/jpeg", "image/png"],
    description: "MIME type of the image",
  }),
  size: t.Number({
    examples: [1024000],
    description: "File size in bytes",
  }),
  height: t.Number({
    examples: [1080],
    description: "Image height in pixels",
  }),
  width: t.Number({
    examples: [1920],
    description: "Image width in pixels",
  }),
  orientation: t.Optional(
    t.Nullable(
      t.Number({
        examples: [1],
        description: "EXIF orientation value (1-8)",
      }),
    ),
  ),
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
  projectId: t.String({ examples: ["proj_123"] }),
  uploaderId: t.Optional(
    t.Nullable(
      t.String({
        examples: ["user_123"],
      }),
    ),
  ),
});

export const ImageAssetSchema = ImageAssetBaseSchema;

export const ImageCreateSchema = t.Omit(ImageAssetSchema, [
  "id",
  "key",
  "createdAt",
  "updatedAt",
  "uploaderId",
]);

export const ImageDeleteSchema = t.Pick(ImageAssetSchema, ["id"]);
