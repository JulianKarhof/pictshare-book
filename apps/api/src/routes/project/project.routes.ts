import prisma from "@api/prisma.js";
import {
  Common404ErrorSchema,
  CommonSuccessMessageSchema,
} from "@api/schemas.js";
import { Elysia, t } from "elysia";
import { ElementSchema } from "../element/element.schema.js";
import {
  ProjectSchema,
  ProjectWithoutElementsSchema,
} from "./project.schemas.js";

const projectRoute = new Elysia({ prefix: "/project" })

  .get(
    "/",
    async () => {
      const projects = await prisma.project.findMany();
      return projects;
    },
    {
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
    "/:id/elements",
    async ({ params: { id } }) => {
      const elements = await prisma.element.findMany({
        where: { projectId: id },
        include: {
          image: true,
          text: true,
          shape: true,
        },
        orderBy: {
          zIndex: "asc",
        },
      });
      return elements;
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

  .get(
    "/:id",
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

      return project;
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
    "/",
    async ({ body: { name } }) => {
      const project = await prisma.project.create({
        data: { name },
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

      return project;
    },
    {
      body: t.Object({
        name: t.String({ examples: ["My Project"] }),
      }),
      response: {
        200: ProjectSchema,
      },
      detail: {
        description: "Create a new project",
        tags: ["Project"],
      },
    },
  )

  .delete(
    "/",
    async ({ body: { id } }) => {
      await prisma.project.delete({
        where: { id },
      });

      return { message: "success" };
    },
    {
      body: t.Object({
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
