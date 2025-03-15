import {
  Prisma,
  ElementType as PrismaElementType,
  ShapeType,
} from "@prisma/client";
import { ElementType } from "./element.schema";

import {
  ElementCreateSchema,
  ElementSchema,
  ElementUpdateSchema,
} from "./element.schema";

export function flattenElement(
  element: Prisma.ElementGetPayload<{
    include: { shape: true; image: { include: { asset: true } }; text: true };
    omit: { projectId: true };
  }>,
): typeof ElementSchema.static {
  const { image, shape, text, ...rest } = element;
  switch (element.type) {
    case PrismaElementType.IMAGE: {
      const { id, elementId, asset, ...imageProps } = image!;
      return {
        ...rest,
        ...imageProps,
        type: ElementType.IMAGE,
      };
    }
    case PrismaElementType.TEXT: {
      const { id, elementId, ...textProps } = text!;
      return {
        ...rest,
        ...textProps,
        type: ElementType.TEXT,
      };
    }
    case PrismaElementType.SHAPE: {
      const { id, elementId, shapeType, cornerRadius, points, ...shapeProps } =
        shape!;
      switch (shapeType!) {
        case ShapeType.CIRCLE:
          return {
            ...rest,
            ...shapeProps,
            type: ElementType.CIRCLE,
          };
        case ShapeType.RECTANGLE:
          return {
            ...rest,
            ...shapeProps,
            cornerRadius,
            type: ElementType.RECTANGLE,
          };
        case ShapeType.DRAWING:
          return {
            ...rest,
            ...shapeProps,
            points: points
              ?.map((_, i, arr) => {
                if (i % 2 === 0) {
                  return { x: arr[i], y: arr[i + 1] };
                }
              })
              .filter((point) => point !== undefined),
            type: ElementType.DRAWING,
          };
      }
    }
  }
}

export function createPrismaData(
  projectId: string,
  body: typeof ElementCreateSchema.static,
): Prisma.ElementCreateInput {
  switch (body.type) {
    case ElementType.IMAGE: {
      const { assetId, ...rest } = body;
      return {
        ...rest,
        project: {
          connect: {
            id: projectId,
          },
        },
        image: {
          create: {
            asset: {
              connect: {
                id: assetId,
              },
            },
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
    case ElementType.CIRCLE:
      const { fill, stroke, strokeWidth, ...rest } = body;

      return {
        ...rest,
        type: PrismaElementType.SHAPE,
        project: {
          connect: {
            id: projectId,
          },
        },
        shape: {
          create: {
            shapeType: ShapeType.CIRCLE,
            fill,
            stroke,
            strokeWidth,
          },
        },
      };
    case ElementType.RECTANGLE: {
      const { fill, stroke, strokeWidth, cornerRadius, ...rest } = body;

      return {
        ...rest,
        type: PrismaElementType.SHAPE,
        project: {
          connect: {
            id: projectId,
          },
        },
        shape: {
          create: {
            shapeType: ShapeType.RECTANGLE,
            fill,
            stroke,
            strokeWidth,
            cornerRadius,
          },
        },
      };
    }

    case ElementType.DRAWING: {
      const { points, stroke, strokeWidth, ...rest } = body;

      return {
        ...rest,
        type: PrismaElementType.SHAPE,
        project: {
          connect: {
            id: projectId,
          },
        },
        shape: {
          create: {
            shapeType: ShapeType.DRAWING,
            stroke,
            strokeWidth,
            points: points.flatMap(({ x, y }) => [x, y]),
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
        ...(body.assetId && {
          image: { update: { asset: { connect: { id: body.assetId } } } },
        }),
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
    case ElementType.CIRCLE:
      return {
        ...baseData,
        ...(body.fill || body.stroke || body.strokeWidth
          ? {
              shape: {
                update: {
                  fill: body.fill,
                  stroke: body.stroke,
                  strokeWidth: body.strokeWidth,
                },
              },
            }
          : {}),
      };
    case ElementType.RECTANGLE:
      return {
        ...baseData,
        ...(body.fill || body.stroke || body.strokeWidth || body.cornerRadius
          ? {
              shape: {
                update: {
                  fill: body.fill,
                  stroke: body.stroke,
                  strokeWidth: body.strokeWidth,
                  cornerRadius: body.cornerRadius,
                },
              },
            }
          : {}),
      };

    case ElementType.DRAWING:
      return {
        ...baseData,
        ...(body.stroke || body.strokeWidth
          ? {
              shape: {
                update: {
                  stroke: body.stroke,
                  strokeWidth: body.strokeWidth,
                },
              },
            }
          : {}),
      };
  }
}
