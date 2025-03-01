import { mock } from "bun:test";

export const S3ServiceMock = {
  uploadFile: mock(() =>
    Promise.resolve({ key: "project-1/images/new-file-id.jpg" }),
  ),
  deleteFile: mock(() => Promise.resolve({ success: true })),
};
