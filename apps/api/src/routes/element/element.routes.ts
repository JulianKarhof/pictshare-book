import prisma from "@api/prisma.js";
import { Elysia, t } from "elysia";
import { ElementSchema, ElementCreateSchema } from "./element.schema.js";
import { Common404ErrorSchema } from "@api/schemas.js";
import { ElementType } from "@prisma/client";

const elementRoute = new Elysia({ prefix: "/element" })

  .get(
    "/:id",
    async ({ params: { id }, error }) => {
      const element = await prisma.element.findUnique({
        where: { id },
        include: {
          image: true,
          text: true,
          shape: true,
        },
      });

      if (!element) {
        return error(404, { message: "Element not found" });
      }

      return element;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: ElementSchema,
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Get an element by ID",
        tags: ["Element"],
      },
    },
  )

  .post(
    "/",
    async ({ body, error }) => {
      if (
        (body.type === ElementType.IMAGE && !body.image) ||
        (body.type === ElementType.TEXT && !body.text) ||
        (body.type === ElementType.SHAPE && !body.shape)
      ) {
        return error(400, {
          message: `Missing ${body.type.toLowerCase()} data`,
        });
      }

      const element = await prisma.element.create({
        data: {
          ...body,
          image:
            body.type === ElementType.IMAGE && body.image
              ? { create: body.image }
              : undefined,
          text:
            body.type === ElementType.TEXT && body.text
              ? { create: body.text }
              : undefined,
          shape:
            body.type === ElementType.SHAPE && body.shape
              ? { create: body.shape }
              : undefined,
          projectId: body.projectId,
        },
        include: {
          image: true,
          text: true,
          shape: true,
        },
      });

      return element;
    },
    {
      body: ElementCreateSchema,
      response: {
        200: ElementSchema,
        400: Common404ErrorSchema,
      },
      detail: {
        description: "Create a new element",
        tags: ["Element"],
      },
    },
  )

  .put(
    "/:id",
    async ({ params: { id }, body, error }) => {
      const existingElement = await prisma.element.findUnique({
        where: { id },
      });

      if (!existingElement) {
        return error(404, { message: "Element not found" });
      }

      const element = await prisma.element.update({
        where: { id },
        data: {
          ...body,
          image: body.image ? { update: body.image } : undefined,
          text: body.text ? { update: body.text } : undefined,
          shape: body.shape ? { update: body.shape } : undefined,
        },
        include: {
          image: true,
          text: true,
          shape: true,
        },
      });

      return element;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Partial(ElementCreateSchema),
      response: {
        200: ElementSchema,
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Update an element",
        tags: ["Element"],
      },
    },
  )

  .delete(
    "/:id",
    async ({ params: { id }, error }) => {
      try {
        await prisma.element.delete({
          where: { id },
        });
        return { message: "Element deleted successfully" };
      } catch (e) {
        return error(404, { message: "Element not found" });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          message: t.String({ examples: ["Element deleted successfully"] }),
        }),
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Delete an element",
        tags: ["Element"],
      },
    },
  );

export default elementRoute;
