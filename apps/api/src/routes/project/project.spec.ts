import { afterEach, describe, expect, it, mock } from "bun:test";
import { createMockPrisma } from "@mocks/prisma.js";
import projectRoute from "@routes/project/project.routes.js";
import { Elysia } from "elysia";

const mockPrisma = createMockPrisma();

mock.module("@api/prisma.js", () => ({
  default: mockPrisma,
}));

describe("Project Routes", () => {
  const app = new Elysia().use(projectRoute);

  afterEach(() => {
    mockPrisma.project.findMany.mockClear();
    mockPrisma.project.findUnique.mockClear();
    mockPrisma.project.create.mockClear();
    mockPrisma.project.delete.mockClear();
    mockPrisma.element.findMany.mockClear();
  });

  it("should list all projects", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects"))
      .then((res) => res.json());

    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(2);
    expect(mockPrisma.project.findMany).toHaveBeenCalled();
    expect(response[0]).toHaveProperty("id", "project-1");
  });

  it("should get a project by ID", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects/project-1"))
      .then((res) => res.json());

    expect(response).toHaveProperty("id", "project-1");
    expect(response).toHaveProperty("name", "Test Project 1");
    expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: "project-1" },
      include: {
        elements: {
          include: {
            image: true,
            text: true,
            shape: true,
          },
        },
      },
    });
  });

  it("should return 404 for non-existent project", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects/nonexistent-id"))
      .then((res) => res.json());

    expect(response).toHaveProperty("message", "Project not found");
    expect(mockPrisma.project.findUnique).toHaveBeenCalled();
  });

  it("should get project elements", async () => {
    const res = await app
      .handle(new Request("http://localhost/projects/project-1/elements"))
      .then((res) => res.json());

    expect(Array.isArray(res)).toBe(true);
    expect(mockPrisma.element.findMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      include: {
        image: true,
        text: true,
        shape: true,
      },
      orderBy: {
        zIndex: "asc",
      },
    });
  });

  it("should create a new project", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "New Project" }),
        }),
      )
      .then((res) => res.json());

    expect(response).toHaveProperty("id", "new-project-id");
    expect(response).toHaveProperty("name", "New Project");
    expect(mockPrisma.project.create).toHaveBeenCalledWith({
      data: { name: "New Project" },
    });
  });

  it("should delete a project", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/projects/project-1", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .then((res) => res.json());

    expect(response).toHaveProperty("message", "success");
    expect(mockPrisma.project.delete).toHaveBeenCalledWith({
      where: { id: "project-1" },
    });
  });
});
