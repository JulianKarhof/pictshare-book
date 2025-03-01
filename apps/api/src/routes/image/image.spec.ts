import { describe, expect, it, mock } from "bun:test";
import { AuthMock } from "@mocks/auth";
import { ElementServiceMock } from "@mocks/element-service";
import { PrismaMock } from "@mocks/prisma";
import { S3ServiceMock } from "@mocks/s3";
import imageRoute from "@routes/image/image.routes";
import { Elysia } from "elysia";

mock.module("@api/auth", () => ({
  auth: AuthMock,
}));

mock.module("@api/prisma", () => ({
  default: PrismaMock,
}));

mock.module("@api/s3", () => ({
  S3Service: S3ServiceMock,
}));

mock.module("@routes/element/element.service", () => ({
  ElementService: ElementServiceMock,
}));

mock.module("image-size", () => {
  const imageSize = function () {
    return {
      height: 500,
      width: 800,
      orientation: 1,
      type: "jpg",
    };
  };

  return {
    imageSize,
    default: imageSize,
  };
});

describe("Image Routes", () => {
  const app = new Elysia().use(imageRoute);

  describe("GET /projects/:id/images", () => {
    it("should return all images for a project", async () => {
      const response = await app
        .handle(new Request("http://localhost/projects/project-1/images"))
        .then((res) => res.json());

      expect(Array.isArray(response)).toBe(true);
      expect(response).toHaveLength(2);
      expect(PrismaMock.imageAsset.findMany).toHaveBeenCalledWith({
        where: { projectId: "project-1" },
      });

      expect(response[0]).toHaveProperty("id", "image-asset-1");
      expect(response[0]).toHaveProperty(
        "key",
        "project-1/images/123456-abcdef.jpg",
      );
      expect(response[0].src).toMatch(
        /\/pictshare-book\/project-1\/images\/123456-abcdef\.jpg$/,
      );
    });
  });

  describe("POST /projects/:id/images", () => {
    it("should upload new images to a project", async () => {
      const formData = new FormData();
      const fileBlob = new Blob(["fake image data"], { type: "image/jpeg" });
      const file = new File([fileBlob], "test-image.jpg", {
        type: "image/jpeg",
      });
      formData.append("files", file);

      const response = await app
        .handle(
          new Request("http://localhost/projects/project-1/images", {
            method: "POST",
            body: formData,
          }),
        )
        .then((res) => res.json());

      expect(Array.isArray(response)).toBe(true);
      expect(ElementServiceMock.hasProjectAccess).toHaveBeenCalledWith(
        "project-1",
        "user-1",
        { roles: ["EDITOR", "OWNER"] },
      );
      expect(S3ServiceMock.uploadFile).toHaveBeenCalled();
      expect(PrismaMock.imageAsset.create).toHaveBeenCalled();

      expect(response[0]).toHaveProperty("id", "new-image-asset-id");
      expect(response[0]).toHaveProperty("src");
    });
  });

  describe("DELETE /images/:id", () => {
    it("should delete an image successfully", async () => {
      const response = await app
        .handle(
          new Request("http://localhost/images/image-asset-1", {
            method: "DELETE",
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("message", "Image deleted successfully");
      expect(ElementServiceMock.hasProjectAccess).toHaveBeenCalledWith(
        "project-1",
        "user-1",
        { roles: ["EDITOR", "OWNER"] },
      );
      expect(PrismaMock.imageAsset.delete).toHaveBeenCalledWith({
        where: { id: "image-asset-1" },
      });
    });

    it("should return 404 when image doesn't exist", async () => {
      const originalFindUnique = PrismaMock.imageAsset.findUnique;
      PrismaMock.imageAsset.findUnique = mock(() => null);

      const response = await app
        .handle(
          new Request("http://localhost/images/nonexistent-id", {
            method: "DELETE",
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("message", "Image not found");

      PrismaMock.imageAsset.findUnique = originalFindUnique;
    });
  });
});
