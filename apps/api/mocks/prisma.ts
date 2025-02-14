import { mock } from "bun:test";
import { ElementType } from "@prisma/client";
import { mockElements } from "./element";
import { mockDate } from "./misc";
import { mockProjects } from "./project";

export const prismaMocks = {
  project: {
    findMany: mock(() => mockProjects.map(({ elements, ...rest }) => rest)),
    findUnique: mock((args) => {
      if (args.where.id === "project-1") {
        return mockProjects[0];
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
      if (args.where.id === "image-element") {
        return mockElements[0];
      }
      return null;
    }),
    create: mock((args) => ({
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
            url: args.data.image.create.url,
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
    })),
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
            url: args.data.image.update.url,
            elementId: args.where.id,
          }
        : {
            id: "image-1",
            url: "https://example.com/image.jpg",
            elementId: args.where.id,
          },
      text: null,
      shape: null,
    })),
    delete: mock(() => ({
      id: "image-1",
      type: ElementType.IMAGE,
      projectId: "project-1",
    })),
  },
};
