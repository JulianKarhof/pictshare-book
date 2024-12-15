import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { Hono } from "hono";
import { z } from "zod";
import prisma from "./prisma.js";

const projectRoute = new Hono()
  .get("/", async (c) => {
    const projects = await prisma.project.findMany();
    return c.json(projects);
  })

  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const project = await prisma.project.findUnique({
      where: { id },
    });
    if (!project) {
      throw new HTTPException(404, { message: "Project not found" });
    }
    return c.json(project);
  })

  .post(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string(),
      }),
    ),
    async (c) => {
      const { name } = c.req.valid("json");
      const project = await prisma.project.create({
        data: { name },
      });
      return c.json(project);
    },
  );

export default projectRoute;
