import { mockUsers } from "./user";

export const mockMembers = [
  {
    projectId: "project-1",
    userId: "user-1",
    user: mockUsers[0],
    role: "OWNER",
  },
  {
    projectId: "project-1",
    userId: "user-2",
    user: mockUsers[1],
    role: "EDITOR",
  },
  {
    projectId: "project-2",
    userId: "user-2",
    user: mockUsers[1],
    role: "OWNER",
  },
  {
    projectId: "project-3",
    userId: "user-1",
    user: mockUsers[0],
    role: "OWNER",
  },
];
