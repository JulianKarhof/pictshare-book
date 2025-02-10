import prisma from "@api/prisma.js";
import {
  Common404ErrorSchema,
  CommonSuccessMessageSchema,
} from "@api/schemas.js";
import { Elysia, t } from "elysia";
import { ElementSchema } from "../element/element.schema.js";
import { flattenElement } from "../element/element.utils.js";
import {
  ProjectCreateSchema,
  ProjectSchema,
  ProjectWithoutElementsSchema,
} from "./project.schema.js";

const projectRoute = new Elysia()

  .get(
    "/projects",
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
    "/projects/:id/elements",
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
    async ({ body: { name } }) => {
      const project = await prisma.project.create({
        data: { name },
      });

      return project;
    },
    {
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
