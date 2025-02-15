import { type Member } from "@prisma/client";

export const mockMembers: Member[] = [
  {
    projectId: "project-1",
    userId: "user-1",
    role: "OWNER",
  },
];
