import env from "@api/env";
import { log } from "@api/logger";
import { authMacro } from "@api/middleware/auth-middleware";
import prisma from "@api/prisma";
import { AuthService } from "@api/routes/auth/auth.service";
import { S3Service } from "@api/s3";
import {
  Common400ErrorSchema,
  Common401ErrorSchema,
  Common404ErrorSchema,
  CommonSuccessMessageSchema,
} from "@api/schemas";
import { Role } from "@prisma/client";
import { Elysia, t } from "elysia";
import { imageSize } from "image-size";
import { ImageDeleteSchema, ImageReturnSchema } from "./image.schema";

const endpoint = env.S3_ENDPOINT;
const bucket = env.S3_BUCKET_NAME;
const accessStyle = env.S3_ACCESS_STYLE;

const constructImageUrl = (key: string) => {
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, "");
  return accessStyle === "virtual"
    ? `${endpoint.startsWith("https") ? "https" : "http"}://${bucket}.${cleanEndpoint}/${key}`
    : `${endpoint}/${bucket}/${key}`;
};

const imageRoute = new Elysia()
  .use(authMacro)

  .get(
    "/projects/:id/images",
    async ({ params: { id } }) => {
      const images = await prisma.imageAsset.findMany({
        where: { projectId: id },
      });

      const imageAssets = images.map((image) => ({
        ...image,
        src: constructImageUrl(image.key),
      }));

      return imageAssets;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Array(ImageReturnSchema),
      },
      detail: {
        description: "Get all images for a project",
        tags: ["Project", "Image"],
      },
    },
  )

  .post(
    "/projects/:id/images",
    async ({ params: { id }, body, user, error }) => {
      const hasAccess = await AuthService.hasProjectAccess(id, user.id, {
        roles: [Role.EDITOR, Role.OWNER],
      });

      if (!hasAccess) {
        return error(401, { message: "Unauthorized" });
      }

      try {
        const uploadedImages = [];

        for (const file of body.files) {
          const extension = file.name
            ? file.name.split(".").pop()
            : file.type.split("/")[1];

          if (!extension) {
            return error(400, {
              message: "Could not determine file extension",
            });
          }

          const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const key = `${id}/images/${fileId}.${extension}`;
          const s3Response = await S3Service.uploadFile(file, key);

          const bytes = await file.bytes();
          const size = imageSize(bytes);
          if (!size.height || !size.width) {
            return error(400, { message: "Invalid image dimensions" });
          }

          const imageAsset = await prisma.imageAsset.create({
            data: {
              key: s3Response.key,
              mimeType: file.type,
              size: file.size,
              height: size.height,
              width: size.width,
              orientation: size.orientation,
              projectId: id,
              uploaderId: user.id,
            },
          });

          uploadedImages.push({
            ...imageAsset,
            src: constructImageUrl(imageAsset.key),
          });
        }

        return uploadedImages;
      } catch (err) {
        log.error("Failed to upload images", err);
        return error(400, { message: "Failed to upload images" });
      }
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        files: t.Files({
          maxSize: 1024 * 1024 * 20,
          maxFiles: 10,
        }),
      }),
      response: {
        200: t.Array(ImageReturnSchema),
        400: Common400ErrorSchema,
        401: Common401ErrorSchema,
      },
      detail: {
        description: "Upload a new image",
        tags: ["Project", "Image"],
      },
    },
  )

  .delete(
    "/images/:id",
    async ({ params: { id }, user, error }) => {
      const image = await prisma.imageAsset.findUnique({
        where: { id },
        include: { project: { select: { id: true } } },
      });

      if (!image) {
        return error(404, { message: "Image not found" });
      }

      const hasAccess = await AuthService.hasProjectAccess(
        image.project.id,
        user.id,
        {
          roles: [Role.EDITOR, Role.OWNER],
        },
      );

      if (!hasAccess) {
        return error(401, { message: "Unauthorized" });
      }

      try {
        // the image file gets deleted automatically because of a prisma client extension
        await prisma.imageAsset.delete({
          where: { id },
        });

        return { message: "Image deleted successfully" };
      } catch (err) {
        log.error("Failed to delete image", err);
        return error(400, { message: "Failed to delete image" });
      }
    },
    {
      isAuth: true,
      params: ImageDeleteSchema,
      response: {
        200: CommonSuccessMessageSchema,
        400: Common400ErrorSchema,
        401: Common401ErrorSchema,
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Delete an image",
        tags: ["Image"],
      },
    },
  );

export default imageRoute;
