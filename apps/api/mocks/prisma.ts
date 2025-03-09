import { mock } from "bun:test";
import { ElementType } from "@prisma/client";
import { mockElements } from "./element";
import { mockImageAssets } from "./image";
import { mockMembers } from "./member";
import { mockDate } from "./misc";
import { mockProjects } from "./project";
import { mockUsers } from "./user";

export const PrismaMock = {
  user: {
    findUnique: mock((args) => {
      if (
        args.where.id === "user-1" ||
        args.where.email === "user1@example.com"
      ) {
        return mockUsers[0];
      } else if (
        args.where.id === "user-2" ||
        args.where.email === "user2@example.com"
      ) {
        return mockUsers[1];
      }
      return null;
    }),
    create: mock((args) => ({
      id: "new-user-id",
      name: args.data.name,
      email: args.data.email,
      emailVerified: true,
      image: args.data.image,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  },

  member: {
    findUnique: mock((args) => {
      return (
        mockMembers.find(
          (member) =>
            member.userId === args.where.memberId.userId &&
            member.projectId === args.where.memberId.projectId,
        ) || null
      );
    }),
    create: mock((args) => ({
      projectId: args.data.projectId,
      userId: args.data.userId,
      role: args.data.role,
      user: mockUsers.find((user) => user.id === args.data.userId),
    })),
    delete: mock(() => ({
      projectId: "project-1",
      userId: "user-2",
      role: "EDITOR",
    })),
  },

  project: {
    findMany: mock((args) => {
      const projects = mockProjects.map(({ elements, ...rest }) => rest);

      if (args.where.members.some.userId) {
        return projects.filter(
          (project) =>
            project.members.find(
              (member) => member.userId === args.where.members.some.userId,
            )?.projectId === project.id,
        );
      }

      return projects;
    }),
    findUnique: mock((args) => {
      if (args.where.id === "project-1") {
        return mockProjects[0];
      } else if (args.where.id === "project-2") {
        return mockProjects[1];
      }
      return null;
    }),
    create: mock((args) => ({
      id: "new-project-id",
      name: args.data.name,
      elements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    delete: mock(() => mockProjects.map(({ elements, ...rest }) => rest)),
  },

  element: {
    findMany: mock(() => mockElements),
    findUnique: mock((args) => {
      if (args.where.id === "image-element" || args.where.id === "image-1") {
        return mockElements[0];
      }
      return null;
    }),
    create: mock((args) => {
      return {
        id: "new-element-id",
        type: args.data.type,
        x: args.data.x,
        y: args.data.y,
        width: args.data.width,
        height: args.data.height,
        scaleX: args.data.scaleX ?? 1,
        scaleY: args.data.scaleY ?? 1,
        angle: args.data.angle ?? 0,
        zIndex: args.data.zIndex ?? 0,
        projectId: args.data.projectId,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
        image: args.data.image?.create
          ? {
              id: "new-image-id",
              assetId: args.data.image.create.asset.connect.id,
              elementId: "new-element-id",
            }
          : null,
        text: args.data.text?.create
          ? {
              id: "new-text-id",
              content: args.data.text.create.content,
              fontSize: args.data.text.create.fontSize,
              fontFamily: args.data.text.create.fontFamily ?? null,
              color: args.data.text.create.color ?? 0x000000,
              elementId: "new-element-id",
            }
          : null,
        shape: args.data.shape?.create
          ? {
              id: "new-shape-id",
              shapeType: args.data.shape.create.shapeType,
              fill: args.data.shape.create.fill,
              stroke: args.data.shape.create.stroke,
              strokeWidth: args.data.shape.create.strokeWidth,
              points: args.data.shape.create.points,
              elementId: "new-element-id",
            }
          : null,
      };
    }),

    update: mock((args) => ({
      id: args.where.id,
      type: ElementType.IMAGE,
      x: args.data.x ?? 100,
      y: args.data.y ?? 100,
      width: args.data.width ?? 200,
      height: args.data.height ?? 200,
      scaleX: args.data.scaleX ?? 1,
      scaleY: args.data.scaleY ?? 1,
      angle: args.data.angle ?? 0,
      zIndex: args.data.zIndex ?? 0,
      projectId: "project-1",
      createdAt: mockDate,
      updatedAt: mockDate,
      image: args.data.image?.update
        ? {
            id: "image-1",
            assetId: args.data.image.update.assetId,
            elementId: args.where.id,
          }
        : {
            id: "image-1",
            assetId: "image-asset-1",
            elementId: args.where.id,
          },
      text: null,
      shape: null,
    })),
    delete: mock((args) => {
      if (args.where.id === "image-1") {
        return {
          id: "image-1",
          type: ElementType.IMAGE,
          projectId: "project-1",
        };
      }
      return null;
    }),
  },

  imageAsset: {
    findMany: mock((args) => {
      if (args.where.projectId === "project-1") {
        return mockImageAssets;
      }
      return [];
    }),
    findUnique: mock((args) => {
      if (args.where.id === "image-asset-1") {
        return mockImageAssets[0];
      } else if (args.where.id === "image-asset-2") {
        return mockImageAssets[1];
      }
      return null;
    }),
    create: mock((args) => ({
      id: "new-image-asset-id",
      key: args.data.key,
      mimeType: args.data.mimeType,
      size: args.data.size,
      height: args.data.height,
      width: args.data.width,
      orientation: args.data.orientation,
      projectId: args.data.projectId,
      uploaderId: args.data.uploaderId,
      createdAt: mockDate,
      updatedAt: mockDate,
    })),
    delete: mock(() => mockImageAssets[0]),
  },
};
