import { describe, expect, it, mock } from "bun:test";
import { authMocks } from "@mocks/auth";
import { prismaMocks } from "@mocks/prisma";
import projectRoute from "@routes/project/project.routes";
import { Elysia } from "elysia";

mock.module("@api/auth", () => ({
  auth: authMocks,
}));

mock.module("@api/prisma", () => ({
  default: prismaMocks,
}));

describe("Project Routes", () => {
  const app = new Elysia().use(projectRoute);

  it("should list all projects", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects"))
      .then((res) => res.json());

    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(2);
    expect(prismaMocks.project.findMany).toHaveBeenCalled();
    expect(response[0]).toHaveProperty("id", "project-1");
  });

  it("should get a project by ID", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects/project-1"))
      .then((res) => res.json());

    expect(response).toHaveProperty("id", "project-1");
    expect(response).toHaveProperty("name", "Test Project 1");
    expect(prismaMocks.project.findUnique).toHaveBeenCalledWith({
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
    expect(prismaMocks.project.findUnique).toHaveBeenCalled();
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
    expect(prismaMocks.project.create).toHaveBeenCalledWith({
      data: {
        name: "New Project",
        members: {
          create: {
            role: "OWNER",
            userId: "user-1",
          },
        },
      },
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
    expect(prismaMocks.project.delete).toHaveBeenCalledWith({
      where: { id: "project-1", members: { some: { userId: "user-1" } } },
    });
  });
});
