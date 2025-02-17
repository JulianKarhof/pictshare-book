# syntax = docker/dockerfile:1

FROM oven/bun:1.2 AS base

LABEL fly_launch_runtime="Bun"
WORKDIR /app
ENV NODE_ENV="production"


FROM base AS build

COPY package.json .
COPY apps/api/package.json .
COPY apps/web/package.json .
COPY bun.lock .

RUN bun install

COPY . .

RUN bunx prisma generate --schema apps/api/prisma/schema.prisma
RUN cd apps/api && bun run build


FROM base AS run

COPY --from=build /app /app

EXPOSE 4000
CMD [ "bun", "apps/api/build/index.js" ]
