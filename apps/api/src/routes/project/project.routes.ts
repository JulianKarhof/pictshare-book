import { authMacro } from "@api/middleware/auth-middleware";
import prisma from "@api/prisma";
import {
  Common403ErrorSchema,
  Common404ErrorSchema,
  Common409ErrorSchema,
  CommonSuccessMessageSchema,
} from "@api/schemas";
import { Role } from "@prisma/client";
import { Elysia, t } from "elysia";
import { ElementService } from "../element/element.service";
import { flattenElement } from "../element/element.utils";
import {
  MemberSchema,
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
              image: {
                include: {
                  asset: true,
                },
              },
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

  .get(
    "projects/:id/users",
    async ({ params: { id: projectId }, user, error }) => {
      const hasAccess = await ElementService.hasProjectAccess(
        projectId,
        user.id,
      );

      if (!hasAccess) {
        return error(403, { message: "Forbidden" });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        return error(404, { message: "Project not found" });
      }

      return project.members.map((member) => ({
        userId: member.userId,
        projectId: member.projectId,
        email: member.user.email,
        role: member.role,
      }));
    },
    {
      isAuth: true,
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Array(MemberSchema),
        403: Common403ErrorSchema,
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Get all members of a project",
        tags: ["Project"],
      },
    },
  )

  .post(
    "/projects/:id/users",
    async ({ params: { id }, body: { email, role }, user, error }) => {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: {
            where: {
              userId: user.id,
            },
          },
        },
      });

      if (!project) {
        return error(404, { message: "Project not found" });
      }

      const hasAccess = await ElementService.hasProjectAccess(
        project.id,
        user.id,
        {
          roles: [Role.OWNER],
        },
      );

      if (!hasAccess) {
        return error(403, { message: "You are not an owner of this project" });
      }

      const userToInvite = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToInvite) {
        return error(404, { message: "User not found" });
      }

      const existingMember = await prisma.member.findUnique({
        where: {
          memberId: {
            projectId: id,
            userId: userToInvite.id,
          },
        },
      });

      if (existingMember) {
        return error(409, {
          message: "User is already a member of this project",
        });
      }

      const member = await prisma.member.create({
        data: {
          projectId: id,
          userId: userToInvite.id,
          role,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      return {
        userId: member.userId,
        projectId: member.projectId,
        email: member.user.email,
        role: member.role,
      };
    },
    {
      isAuth: true,
      body: t.Object({
        email: t.String({ format: "email" }),
        role: t.Enum(Role),
      }),
      response: {
        200: MemberSchema,
        403: Common403ErrorSchema,
        404: Common404ErrorSchema,
        409: Common409ErrorSchema,
      },
      detail: {
        description: "Invite a user to a project",
        tags: ["Project"],
      },
    },
  )

  .delete(
    "projects/:id/users/:userId",
    async ({ params: { id: projectId, userId }, user, error }) => {
      const hasAccess = await ElementService.hasProjectAccess(
        projectId,
        user.id,
        {
          roles: [Role.OWNER],
        },
      );

      if (!hasAccess) {
        return error(403, { message: "You are not an owner of this project" });
      }

      await prisma.member.delete({
        where: {
          memberId: {
            projectId: projectId,
            userId: userId,
          },
        },
      });

      return { message: "User removed successfully" };
    },
    {
      isAuth: true,
      response: {
        200: CommonSuccessMessageSchema,
        403: Common403ErrorSchema,
        404: Common404ErrorSchema,
      },
      detail: {
        description: "Remove a user from a project",
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
    async ({ params: { id }, user }) => {
      await prisma.project.delete({
        where: {
          id,
          members: {
            some: {
              userId: user.id,
            },
          },
        },
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
