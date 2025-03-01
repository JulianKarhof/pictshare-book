import { ElementType } from "@prisma/client";
import { mockImageAssets } from "./image";
import { mockDate } from "./misc";

export const mockElements = [
  {
    id: "image-element",
    project: {
      id: "project-1",
    },
    type: ElementType.IMAGE,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    zIndex: 0,
    image: {
      id: "image-1",
      elementId: "image-element",
      asset: mockImageAssets[0],
      assetId: mockImageAssets[0].id,
    },
    text: null,
    shape: null,
    createdAt: mockDate.toISOString(),
    updatedAt: mockDate.toISOString(),
  },
];
