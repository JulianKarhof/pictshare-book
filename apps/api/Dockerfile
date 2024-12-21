# syntax = docker/dockerfile:1

FROM oven/bun:1 AS base

LABEL fly_launch_runtime="Bun"
WORKDIR /app
ENV NODE_ENV="production"


FROM base AS build

COPY package.json bun.lockb ./
RUN bun install

COPY . .

RUN bunx prisma generate
RUN bun run build


FROM base

COPY --from=build /app /app

EXPOSE 4000
CMD [ "bun", "build/index.js" ]
