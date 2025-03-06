import { mockElements } from "./element";
import { mockMembers } from "./member";
import { mockDate } from "./misc";

export const mockProjects = [
  {
    id: "project-1",
    name: "Test Project 1",
    elements: [mockElements[0]],
    members: [mockMembers[0], mockMembers[1]],
    createdAt: mockDate,
    updatedAt: mockDate,
  },
  {
    id: "project-2",
    name: "Test Project 2",
    elements: [],
    members: [mockMembers[2]],
    createdAt: mockDate,
    updatedAt: mockDate,
  },
  {
    id: "project-3",
    name: "Test Project 3",
    elements: [],
    members: [mockMembers[3]],
    createdAt: mockDate,
    updatedAt: mockDate,
  },
];
