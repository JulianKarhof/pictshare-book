import { mockElements } from "./element";
import { mockDate } from "./misc";

export const mockProjects = [
  {
    id: "project-1",
    name: "Test Project 1",
    elements: [mockElements[0]],
    createdAt: mockDate,
    updatedAt: mockDate,
  },
  {
    id: "project-2",
    name: "Test Project 2",
    elements: [],
    createdAt: mockDate,
    updatedAt: mockDate,
  },
];
