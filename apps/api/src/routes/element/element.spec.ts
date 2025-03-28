import { describe, expect, it, mock } from "bun:test";
import { AuthMock } from "@mocks/auth";
import { PrismaMock } from "@mocks/prisma";
import { ElementType } from "@prisma/client";
import { Elysia } from "elysia";
import elementRoute from "./element.routes";

mock.module("@api/auth", () => ({
  auth: AuthMock,
}));

mock.module("@api/prisma", () => ({
  default: PrismaMock,
}));

describe("Element Routes", () => {
  const app = new Elysia().use(elementRoute);

  describe("GET /:id", () => {
    it("should get an element by ID", async () => {
      const response = await app
        .handle(new Request("http://localhost/elements/image-element"))
        .then((res) => res.json());

      expect(response).toHaveProperty("id", "image-element");
      expect(response).toHaveProperty("type", ElementType.IMAGE);
    });

    it("should return 404 for non-existent element", async () => {
      const response = await app
        .handle(new Request("http://localhost/elements/nonexistent"))
        .then((res) => res.json());

      expect(response).toHaveProperty("message", "Element not found");
    });
  });

  it("should get project elements", async () => {
    const res = await app
      .handle(new Request("http://localhost/projects/project-1/elements"))
      .then((res) => res.json());

    expect(Array.isArray(res)).toBe(true);
    expect(PrismaMock.element.findMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      include: {
        image: { include: { asset: true } },
        text: true,
        shape: true,
      },
      orderBy: {
        zIndex: "asc",
      },
    });
  });

  describe("POST /", () => {
    it("should create an image element", async () => {
      const elementData = {
        type: ElementType.IMAGE,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        zIndex: 0,
        projectId: "test-project-1",
        assetId: "image-asset-1",
      };

      const response = await app
        .handle(
          new Request("http://localhost/projects/project-1/elements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(elementData),
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("id", "new-element-id");
      expect(response).toMatchObject({
        type: ElementType.IMAGE,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        zIndex: 0,
      });
    });

    it("should create a text element", async () => {
      const elementData = {
        type: ElementType.TEXT,
        x: 100,
        y: 100,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        width: 200,
        height: 200,
        zIndex: 0,
        projectId: "test-project-1",
        content: "Hello World",
        fontSize: 16,
        fontFamily: "Arial",
        color: 0x000000,
      };

      const response = await app
        .handle(
          new Request("http://localhost/projects/project-1/elements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(elementData),
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("id", "new-element-id");
      expect(response).toHaveProperty("content", "Hello World");
      expect(response).toHaveProperty("fontSize", 16);
    });
  });

  describe("PUT /:id", () => {
    it("should update an element", async () => {
      const updateData = {
        type: ElementType.IMAGE,
        x: 150,
        y: 150,
        width: 200,
        height: 200,
        scaleX: 2,
        scaleY: 2,
        angle: 0.5,
        zIndex: 10,
      };

      const response = await app
        .handle(
          new Request("http://localhost/elements/image-element", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          }),
        )
        .then((res) => res.json());

      expect(response).toMatchObject(updateData);
    });

    it("should return 404 for non-existent element", async () => {
      const response = await app
        .handle(
          new Request("http://localhost/elements/nonexistent", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: ElementType.IMAGE,
              x: 150,
            }),
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("message", "Element not found");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete an element", async () => {
      const response = await app
        .handle(
          new Request("http://localhost/elements/image-1", {
            method: "DELETE",
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty(
        "message",
        "Element deleted successfully",
      );
    });

    it("should return 404 for non-existent element", async () => {
      const response = await app
        .handle(
          new Request("http://localhost/elements/nonexistent", {
            method: "DELETE",
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("message", "Element not found");
    });
  });
});
