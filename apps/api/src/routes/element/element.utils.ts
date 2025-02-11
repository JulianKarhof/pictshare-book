import { ElementType, Prisma } from "@prisma/client";
import {
  ElementCreateSchema,
  ElementSchema,
  ElementUpdateSchema,
} from "./element.schema";

export function flattenElement(
  element: Prisma.ElementGetPayload<{
    include: { shape: true; image: true; text: true };
    omit: { projectId: true };
  }>,
): typeof ElementSchema.static {
  const { image, shape, text, ...rest } = element;
  switch (element.type) {
    case ElementType.IMAGE: {
      const { id, elementId, ...imageProps } = image!;
      return {
        ...rest,
        ...imageProps,
        type: ElementType.IMAGE,
      };
    }
    case ElementType.TEXT: {
      const { id, elementId, ...textProps } = text!;
      return {
        ...rest,
        ...textProps,
        type: ElementType.TEXT,
      };
    }
    case ElementType.SHAPE: {
      const { id, elementId, ...shapeProps } = shape!;
      return {
        ...rest,
        ...shapeProps,
        type: ElementType.SHAPE,
      };
    }
  }
}

export function createPrismaData(
  projectId: string,
  body: typeof ElementCreateSchema.static,
): Prisma.ElementCreateInput {
  switch (body.type) {
    case ElementType.IMAGE: {
      const { url, ...rest } = body;
      return {
        ...rest,
        project: {
          connect: {
            id: projectId,
          },
        },
        image: {
          create: {
            url: url,
          },
        },
      };
    }
    case ElementType.TEXT: {
      const { content, fontSize, fontFamily, color, ...rest } = body;
      return {
        ...rest,
        project: {
          connect: {
            id: projectId,
          },
        },
        text: {
          create: {
            content,
            fontSize,
            fontFamily,
            color,
          },
        },
      };
    }
    case ElementType.SHAPE: {
      const { shapeType, fill, stroke, strokeWidth, points, ...rest } = body;
      return {
        ...rest,
        project: {
          connect: {
            id: projectId,
          },
        },
        shape: {
          create: {
            shapeType,
            fill,
            stroke,
            strokeWidth,
            points: points ?? [],
          },
        },
      };
    }
  }
}

export function createUpdateData(
  body: typeof ElementUpdateSchema.static,
): Prisma.ElementUpdateInput {
  const baseData = {
    x: body.x,
    y: body.y,
    width: body.width,
    height: body.height,
    scaleX: body.scaleX,
    scaleY: body.scaleY,
    angle: body.angle,
    zIndex: body.zIndex,
  };

  switch (body.type) {
    case ElementType.IMAGE:
      return {
        ...baseData,
        ...(body.url && { image: { update: { url: body.url } } }),
      };
    case ElementType.TEXT:
      return {
        ...baseData,
        ...(body.content || body.fontSize || body.fontFamily || body.color
          ? {
              text: {
                update: {
                  content: body.content,
                  fontSize: body.fontSize,
                  fontFamily: body.fontFamily,
                  color: body.color,
                },
              },
            }
          : {}),
      };
    case ElementType.SHAPE:
      return {
        ...baseData,
        ...(body.shapeType ||
        body.fill ||
        body.stroke ||
        body.strokeWidth ||
        body.points
          ? {
              shape: {
                update: {
                  shapeType: body.shapeType,
                  fill: body.fill,
                  stroke: body.stroke,
                  strokeWidth: body.strokeWidth,
                  points: body.points ?? [],
                },
              },
            }
          : {}),
      };
  }
}
