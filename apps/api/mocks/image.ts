import { mockDate } from "./misc";

export const mockImageAssets = [
  {
    id: "image-asset-1",
    key: "project-1/images/123456-abcdef.jpg",
    mimeType: "image/jpeg",
    size: 1024 * 100,
    height: 1200,
    width: 1800,
    orientation: 1,
    projectId: "project-1",
    uploaderId: "user-1",
    project: { id: "project-1" },
    createdAt: mockDate,
    updatedAt: mockDate,
  },
  {
    id: "image-asset-2",
    key: "project-1/images/234567-bcdefg.png",
    mimeType: "image/png",
    size: 1024 * 150,
    height: 800,
    width: 600,
    orientation: 1,
    projectId: "project-1",
    uploaderId: "user-1",
    project: { id: "project-1" },
    createdAt: mockDate,
    updatedAt: mockDate,
  },
];
