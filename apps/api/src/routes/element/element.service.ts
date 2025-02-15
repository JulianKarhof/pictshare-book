import prisma from "@api/prisma";
import { Role } from "@prisma/client";

export abstract class ElementService {
  static async hasProjectAccess(
    projectId: string,
    userId: string,
    settings: { roles?: Role[] } = {},
  ): Promise<Role | null> {
    const hasAccess = await prisma.member.findUnique({
      where: {
        memberId: {
          projectId: projectId,
          userId: userId,
        },
        role: settings.roles
          ? {
              in: settings.roles,
            }
          : undefined,
      },
    });

    if (!hasAccess) {
      return null;
    }

    return hasAccess.role;
  }
}
