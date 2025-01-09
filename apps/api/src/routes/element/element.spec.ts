import { describe, expect, it, mock, afterEach } from "bun:test";
import { Elysia } from "elysia";
import elementRoute from "./element.routes.js";
import { ElementType } from "@prisma/client";
import { createMockPrisma } from "@mocks/prisma.js";
import { mockElements } from "@mocks/element.js";

const mockPrisma = createMockPrisma();

mock.module("@api/prisma.js", () => ({
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
        .handle(new Request("http://localhost/element/image-element"))
        .then((res) => res.json());

      expect(response).toHaveProperty("id", "image-element");
      expect(response).toHaveProperty("type", ElementType.IMAGE);
      expect(response.image).toHaveProperty(
        "url",
        "https://example.com/image.jpg",
      );
    });

    it("should return 404 for non-existent element", async () => {
      const response = await app
        .handle(new Request("http://localhost/element/nonexistent"))
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
        image: {
          url: "https://example.com/new-image.jpg",
        },
      };

      const response = await app
        .handle(
          new Request("http://localhost/element", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(elementData),
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("id", "new-element-id");
      expect(response.image).toHaveProperty(
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
        text: {
          content: "Hello World",
          fontSize: 16,
        },
      };

      const response = await app
        .handle(
          new Request("http://localhost/element", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(elementData),
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("id", "new-element-id");
      expect(response.text).toHaveProperty("content", "Hello World");
    });

    it("should return 400 for missing element type data", async () => {
      const elementData = {
        ...mockElements[0],
        image: undefined,
        text: undefined,
        shape: undefined,
      };

      const response = await app
        .handle(
          new Request("http://localhost/element", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(elementData),
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("message", "Missing image data");
    });
  });

  describe("PUT /:id", () => {
    it("should update an element", async () => {
      const updateData = {
        x: 150,
        y: 150,
        width: 200,
        height: 200,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        zIndex: 0,
      };

      const response = await app
        .handle(
          new Request("http://localhost/element/image-element", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          }),
        )
        .then((res) => res.json());

      expect(response).toMatchObject({ ...mockElements[0], ...updateData });
    });

    it("should return 404 for non-existent element", async () => {
      const response = await app
        .handle(
          new Request("http://localhost/element/nonexistent", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x: 150 }),
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
          new Request("http://localhost/element/test-image-1", {
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
          new Request("http://localhost/element/nonexistent", {
            method: "DELETE",
          }),
        )
        .then((res) => res.json());

      expect(response).toHaveProperty("message", "Element not found");
    });
  });
});
