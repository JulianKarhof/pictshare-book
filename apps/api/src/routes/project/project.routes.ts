import { authMacro } from "@api/middleware/auth-middleware";
import prisma from "@api/prisma";
import { Common404ErrorSchema, CommonSuccessMessageSchema } from "@api/schemas";
import { Elysia, t } from "elysia";
import { flattenElement } from "../element/element.utils";
import {
  ProjectCreateSchema,
  ProjectSchema,
  ProjectWithoutElementsSchema,
} from "./project.schema";

const projectRoute = new Elysia()

  .use(authMacro)

  .get(
    "/projects",
    async ({ user }) => {
      const projects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      });

      return projects;
    },
    {
      isAuth: true,
      response: {
        200: t.Array(ProjectWithoutElementsSchema),
      },
      detail: {
        description: "List all projects (excludes elements)",
        tags: ["Project"],
      },
    },
  )

  .get(
    "/projects/:id",
    async ({ params: { id }, error }) => {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          elements: {
            include: {
              image: true,
              text: true,
              shape: true,
            },
          },
        },
      });

      if (!project) {
        return error(404, { message: "Project not found" });
      }

      return {
        ...project,
        elements: project.elements.map(flattenElement),
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: ProjectSchema,
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Get a project by ID",
        tags: ["Project"],
      },
    },
  )

  .post(
    "/projects",
    async ({ body: { name }, user }) => {
      const project = await prisma.project.create({
        data: {
          name,
          members: {
            create: {
              role: "OWNER",
              userId: user.id,
            },
          },
        },
      });

      return project;
    },
    {
      isAuth: true,
      body: ProjectCreateSchema,
      response: {
        200: ProjectWithoutElementsSchema,
      },
      detail: {
        description: "Create a new project",
        tags: ["Project"],
      },
    },
  )

  .delete(
    "/projects/:id",
    async ({ params: { id } }) => {
      await prisma.project.delete({
        where: { id },
      });

      return { message: "success" };
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: CommonSuccessMessageSchema,
      },
      detail: {
        description: "Delete a project",
        tags: ["Project"],
      },
    },
  );

export default projectRoute;
