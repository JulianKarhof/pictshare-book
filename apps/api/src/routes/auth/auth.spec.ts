import { describe, expect, it, mock } from "bun:test";
import { AuthService } from "@api/routes/auth/auth.service";
import { AuthMock } from "@mocks/auth";
import { PrismaMock } from "@mocks/prisma";
import { Role } from "@prisma/client";

mock.module("@api/prisma", () => ({
  default: PrismaMock,
}));

mock.module("@api/auth", () => ({
  auth: AuthMock,
}));

describe("AuthService", () => {
  it("hasProjectAccess should return role when user has access", async () => {
    const projectId = "project-1";
    const userId = "user-1";
    const expectedRole = Role.OWNER;

    const result = await AuthService.hasProjectAccess(projectId, userId);

    expect(result).toBe(expectedRole);
  });

  it("hasProjectAccess should return null when user has no access", async () => {
    const projectId = "project-1";
    const userId = "non-existent-user";

    const result = await AuthService.hasProjectAccess(projectId, userId);

    expect(result).toBeNull();
  });
});
