import { authMacro } from "@api/middleware/auth-middleware";
import prisma from "@api/prisma";
import { AuthService } from "@api/routes/auth/auth.service";
import {
  Common400ErrorSchema,
  Common401ErrorSchema,
  Common404ErrorSchema,
  CommonSuccessMessageSchema,
} from "@api/schemas";
import { Role } from "@prisma/client";
import { Elysia, t } from "elysia";
import {
  ElementCreateSchema,
  ElementSchema,
  ElementUpdateSchema,
  ElementUpsertSchema,
} from "./element.schema";
import {
  createPrismaData,
  createUpdateData,
  flattenElement,
} from "./element.utils";

const elementRoute = new Elysia()

  .use(authMacro)

  .get(
    "/elements/:id",
    async ({ params: { id }, error }) => {
      const element = await prisma.element.findUnique({
        where: { id },
        include: {
          image: { include: { asset: true } },
          text: true,
          shape: true,
        },
      });

      if (!element) {
        return error(404, { message: "Element not found" });
      }

      return flattenElement(element);
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

  .get(
    "/projects/:id/elements",
    async ({ params: { id } }) => {
      const elements = await prisma.element.findMany({
        where: { projectId: id },
        include: {
          image: { include: { asset: true } },
          text: true,
          shape: true,
        },
        orderBy: {
          zIndex: "asc",
        },
      });

      return elements.map(flattenElement);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Array(ElementSchema),
      },
      detail: {
        description: "Get all elements for a project",
        tags: ["Project", "Element"],
      },
    },
  )

  .post(
    "/projects/:id/elements",
    async ({ params: { id }, body, error, user }) => {
      const hasAccess = await AuthService.hasProjectAccess(id, user.id, {
        roles: [Role.EDITOR, Role.OWNER],
      });

      if (!hasAccess) {
        return error(401, { message: "Unauthorized" });
      }

      const element = await prisma.element.create({
        data: createPrismaData(id, body),
        include: {
          image: { include: { asset: true } },
          text: true,
          shape: true,
        },
      });

      return flattenElement(element);
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: ElementCreateSchema,
      response: {
        200: ElementSchema,
        401: Common401ErrorSchema,
      },
      detail: {
        description: "Create a new element",
        tags: ["Project", "Element"],
      },
    },
  )

  .post(
    "/projects/:id/elements/bulk",
    async ({ params: { id }, body, user, error }) => {
      const hasAccess = await AuthService.hasProjectAccess(id, user.id, {
        roles: [Role.EDITOR, Role.OWNER],
      });

      if (!hasAccess) {
        return error(401, { message: "Unauthorized" });
      }

      await prisma.$transaction(
        body.map((element) =>
          prisma.element.create({
            data: createPrismaData(id, element),
          }),
        ),
      );

      return { message: "success" };
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Array(ElementCreateSchema),
      response: {
        200: CommonSuccessMessageSchema,
        401: Common401ErrorSchema,
      },
      detail: {
        description: "Create multiple elements",
        tags: ["Element"],
      },
    },
  )

  .put(
    "/projects/:id/elements/bulk",
    async ({ params: { id }, body, user, error }) => {
      const hasAccess = await AuthService.hasProjectAccess(id, user.id, {
        roles: [Role.EDITOR, Role.OWNER],
      });

      if (!hasAccess) {
        return error(401, { message: "Unauthorized" });
      }

      await prisma.$transaction(
        body.map((element) =>
          prisma.element.upsert({
            where: { id: element.id },
            create: createPrismaData(id, element),
            update: createUpdateData(element),
          }),
        ),
      );

      return { message: "success" };
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Array(ElementUpsertSchema),
      response: {
        200: CommonSuccessMessageSchema,
        401: Common401ErrorSchema,
      },
      detail: {
        description: "Update multiple elements",
        tags: ["Element"],
      },
    },
  )

  .put(
    "/elements/:id",
    async ({ params: { id }, body, user, error }) => {
      const existing = await prisma.element.findUnique({
        where: { id },
        include: {
          image: true,
          text: true,
          shape: true,
          project: { select: { id: true } },
        },
      });

      if (!existing) {
        return error(404, { message: "Element not found" });
      }

      const hasAccess = await AuthService.hasProjectAccess(
        existing.project.id,
        user.id,
        {
          roles: [Role.EDITOR, Role.OWNER],
        },
      );

      if (!hasAccess) {
        return error(401, { message: "Unauthorized" });
      }

      const updated = await prisma.element.update({
        where: { id },
        data: createUpdateData(body),
        include: {
          image: { include: { asset: true } },
          text: true,
          shape: true,
        },
      });

      return flattenElement(updated);
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: ElementUpdateSchema,
      response: {
        200: ElementSchema,
        400: Common400ErrorSchema,
        401: Common401ErrorSchema,
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Update an element",
        tags: ["Element"],
      },
    },
  )

  .delete(
    "/elements/:id",
    async ({ params: { id }, user, error }) => {
      const element = await prisma.element.findUnique({
        where: { id },
        include: { project: { select: { id: true } } },
      });

      if (!element) {
        return error(404, { message: "Element not found" });
      }

      const hasAccess = await AuthService.hasProjectAccess(
        element.project.id,
        user.id,
        {
          roles: [Role.EDITOR, Role.OWNER],
        },
      );

      if (!hasAccess) {
        return error(401, { message: "Unauthorized" });
      }

      await prisma.element.delete({
        where: { id },
      });

      return { message: "Element deleted successfully" };
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: CommonSuccessMessageSchema,
        401: Common401ErrorSchema,
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Delete an element",
        tags: ["Element"],
      },
    },
  );

export default elementRoute;
