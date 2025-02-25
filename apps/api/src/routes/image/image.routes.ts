import { log } from "@api/logger";
import { authMacro } from "@api/middleware/auth-middleware";
import prisma from "@api/prisma";
import { S3Service } from "@api/s3";
import {
  Common400ErrorSchema,
  Common401ErrorSchema,
  Common404ErrorSchema,
  CommonSuccessMessageSchema,
} from "@api/schemas";
import { Role } from "@prisma/client";
import { Elysia, t } from "elysia";
import imageSize from "image-size";
import { ElementService } from "../element/element.service";
import { ImageAssetSchema, ImageDeleteSchema } from "./image.schema";

const imageRoute = new Elysia()
  .use(authMacro)

  .get(
    "/projects/:id/images",
    async ({ params: { id } }) => {
      const images = await prisma.imageAsset.findMany({
        where: { projectId: id },
      });

      return images;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Array(ImageAssetSchema),
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
      const hasAccess = await ElementService.hasProjectAccess(id, user.id, {
        roles: [Role.EDITOR, Role.OWNER],
      });

      if (!hasAccess) {
        return error(401, { message: "Unauthorized" });
      }

      try {
        const extension = body.file.name
          ? body.file.name.split(".").pop()
          : body.file.type.split("/")[1];

        if (!extension) {
          return error(400, { message: "Could not determine file extension" });
        }

        const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const key = `${id}/images/${fileId}.${extension}`;
        const s3Response = await S3Service.uploadFile(body.file, key);

        const bytes = await body.file.bytes();
        const size = imageSize(bytes);
        if (!size.height || !size.width) {
          return error(400, { message: "Invalid image dimensions" });
        }

        const imageAsset = await prisma.imageAsset.create({
          data: {
            key: s3Response.key,
            mimeType: body.file.type,
            size: body.file.size,
            height: size.height,
            width: size.width,
            orientation: size.orientation,
            projectId: id,
            uploaderId: user.id,
          },
        });

        return imageAsset;
      } catch (err) {
        log.error("Failed to upload image", err);
        return error(400, { message: "Failed to upload image" });
      }
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        file: t.File({}),
      }),
      response: {
        200: ImageAssetSchema,
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

      const hasAccess = await ElementService.hasProjectAccess(
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
