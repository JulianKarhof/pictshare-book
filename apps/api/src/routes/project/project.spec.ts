import { describe, expect, it, mock } from "bun:test";
import { AuthMock } from "@mocks/auth";
import { ElementServiceMock } from "@mocks/element-service";
import { PrismaMock } from "@mocks/prisma";
import { mockUsers } from "@mocks/user";
import type { Project } from "@prisma/client";
import projectRoute from "@routes/project/project.routes";
import { Elysia } from "elysia";

mock.module("@api/auth", () => ({
  auth: AuthMock,
}));

mock.module("@api/prisma", () => ({
  default: PrismaMock,
}));

mock.module("@routes/element/element.service", () => ({
  ElementService: ElementServiceMock,
}));

describe("Project Routes", () => {
  const app = new Elysia().use(projectRoute);

  it("should list all projects for a user", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects"))
      .then((res) => res.json());

    expect(Array.isArray(response)).toBe(true);
    expect(response).toHaveLength(2);
    expect(PrismaMock.project.findMany).toHaveBeenCalled();
    expect(response[0]).toHaveProperty("id", "project-1");
  });

  it("should not list projects the user is not a member of", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects"))
      .then((res) => res.json());

    expect(Array.isArray(response)).toBe(true);
    expect(
      response.find((project: Project) => project.id === "project-2"),
    ).not.toBeDefined();
  });

  it("should get a project by ID", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects/project-1"))
      .then((res) => res.json());

    expect(response).toHaveProperty("id", "project-1");
    expect(response).toHaveProperty("name", "Test Project 1");
    expect(response).toHaveProperty("members");
    expect(response).toHaveProperty("elements");
    expect(PrismaMock.project.findUnique).toHaveBeenCalled();
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

  it("should get project members", async () => {
    const response = await app
      .handle(new Request("http://localhost/projects/project-1/users"))
      .then((res) => res.json());

    expect(Array.isArray(response)).toBe(true);
    expect(ElementServiceMock.hasProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
    );
    expect(PrismaMock.project.findUnique).toHaveBeenCalledWith({
      where: { id: "project-1" },
      include: {
        members: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  });

  it("should add a new member to project", async () => {
    AuthMock.api.getSession.mockReturnValueOnce({
      session: {
        id: "test-session-id-2",
        token: "test-token-2",
        userId: mockUsers[1].id,
      },
      user: mockUsers[1],
    });

    const response = await app
      .handle(
        new Request("http://localhost/projects/project-2/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user1@example.com",
            role: "EDITOR",
          }),
        }),
      )
      .then((res) => res.json());

    expect(ElementServiceMock.hasProjectAccess).toHaveBeenCalledWith(
      "project-2",
      "user-2",
      { roles: ["OWNER"] },
    );
    expect(response).toHaveProperty("email", "user1@example.com");
    expect(response).toHaveProperty("name", "User One");
    expect(response).toHaveProperty("role", "EDITOR");
  });

  it("should error if the member is already in the project", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/projects/project-1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user2@example.com",
            role: "EDITOR",
          }),
        }),
      )
      .then((res) => res.json());

    expect(ElementServiceMock.hasProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      { roles: ["OWNER"] },
    );
    expect(response).toHaveProperty(
      "message",
      "User is already a member of this project",
    );
  });

  it("should error when non-owner tries to add member", async () => {
    ElementServiceMock.hasProjectAccess.mockImplementationOnce(() =>
      Promise.resolve(false),
    );

    const response = await app
      .handle(
        new Request("http://localhost/projects/project-1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user2@example.com",
            role: "EDITOR",
          }),
        }),
      )
      .then((res) => res.json());

    expect(response).toHaveProperty(
      "message",
      "You are not an owner of this project",
    );
  });

  it("should remove a member from project", async () => {
    const response = await app
      .handle(
        new Request("http://localhost/projects/project-1/users/user-2", {
          method: "DELETE",
        }),
      )
      .then((res) => res.json());

    expect(response).toHaveProperty("message", "User removed successfully");
    expect(ElementServiceMock.hasProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      { roles: ["OWNER"] },
    );
    expect(PrismaMock.member.delete).toHaveBeenCalledWith({
      where: {
        memberId: {
          projectId: "project-1",
          userId: "user-2",
        },
      },
    });
  });

  it("should error when non-owner tries to remove member", async () => {
    ElementServiceMock.hasProjectAccess.mockImplementationOnce(() =>
      Promise.resolve(false),
    );

    const response = await app
      .handle(
        new Request("http://localhost/projects/project-1/users/user-2", {
          method: "DELETE",
        }),
      )
      .then((res) => res.json());

    expect(response).toHaveProperty(
      "message",
      "You are not an owner of this project",
    );
  });
});
