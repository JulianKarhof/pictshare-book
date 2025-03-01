import { describe, expect, it, mock } from "bun:test";
import { AuthMock } from "@mocks/auth";
import { PrismaMock } from "@mocks/prisma";
import projectRoute from "@routes/project/project.routes";
import { Elysia } from "elysia";

mock.module("@api/auth", () => ({
  auth: AuthMock,
}));

mock.module("@api/prisma", () => ({
  default: PrismaMock,
}));

describe("Project Routes", () => {
  const app = new Elysia().use(projectRoute);

  it("should list all projects", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects"))
      .then((res) => res.json());

    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(2);
    expect(PrismaMock.project.findMany).toHaveBeenCalled();
    expect(response[0]).toHaveProperty("id", "project-1");
  });

  it("should get a project by ID", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects/project-1"))
      .then((res) => res.json());

    expect(response).toHaveProperty("id", "project-1");
    expect(response).toHaveProperty("name", "Test Project 1");
    expect(PrismaMock.project.findUnique).toHaveBeenCalledWith({
      where: { id: "project-1" },
      include: {
        elements: {
          include: {
            image: {
              include: {
                asset: true,
              },
            },
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
    expect(PrismaMock.project.findUnique).toHaveBeenCalled();
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
    expect(PrismaMock.project.create).toHaveBeenCalledWith({
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
    expect(PrismaMock.project.delete).toHaveBeenCalledWith({
      where: { id: "project-1", members: { some: { userId: "user-1" } } },
    });
  });
});
