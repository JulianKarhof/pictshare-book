import { afterEach, describe, expect, it, mock } from "bun:test";
import { createMockPrisma } from "@mocks/prisma";
import { ElementType } from "@prisma/client";
import { Elysia } from "elysia";
import elementRoute from "./element.routes";

const mockPrisma = createMockPrisma();

mock.module("@api/prisma", () => ({
  default: mockPrisma,
}));

describe("Element Routes", () => {
  const app = new Elysia().use(elementRoute);

  afterEach(() => {
    mockPrisma.element.findUnique.mockClear();
    mockPrisma.element.findMany.mockClear();
    mockPrisma.element.create.mockClear();
    mockPrisma.element.update.mockClear();
    mockPrisma.element.delete.mockClear();
  });

  describe("GET /:id", () => {
    it("should get an element by ID", async () => {
      const response = await app
        .handle(new Request("http://localhost/elements/image-element"))
        .then((res) => res.json());

      expect(response).toHaveProperty("id", "image-element");
      expect(response).toHaveProperty("type", ElementType.IMAGE);
      expect(response).toHaveProperty("url", "https://example.com/image.jpg");
    });

    it("should return 404 for non-existent element", async () => {
      const response = await app
        .handle(new Request("http://localhost/elements/nonexistent"))
        .then((res) => res.json());

      expect(response).toHaveProperty("message", "Element not found");
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
        url: "https://example.com/new-image.jpg",
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
      expect(response).toHaveProperty(
        "url",
        "https://example.com/new-image.jpg",
      );
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
        url: "https://example.com/updated-image.jpg",
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
          new Request("http://localhost/elements/test-image-1", {
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
      mockPrisma.element.delete.mockImplementationOnce(() => {
        throw new Error("Element not found");
      });

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
