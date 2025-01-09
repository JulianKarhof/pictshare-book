import { ElementType } from "@prisma/client";
import { mockDate } from "./misc.js";

export const mockElements = [
  {
    id: "image-element",
    projectId: "project-1",
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
      url: "https://example.com/image.jpg",
      elementId: "image-element",
    },
    text: null,
    shape: null,
    createdAt: mockDate.toISOString(),
    updatedAt: mockDate.toISOString(),
  },
];
