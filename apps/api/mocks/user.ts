import { mockDate } from "./misc";

export const mockUsers = [
  {
    id: "user-1",
    name: "User One",
    email: "user1@example.com",
    emailVerified: true,
    image: "",
    createdAt: mockDate.toISOString(),
    updatedAt: mockDate.toISOString(),
  },
  {
    id: "user-2",
    name: "User Two",
    email: "user2@example.com",
    emailVerified: true,
    image: "",
    createdAt: mockDate.toISOString(),
    updatedAt: mockDate.toISOString(),
  },
];
