# syntax = docker/dockerfile:1

FROM oven/bun:1 AS base

LABEL fly_launch_runtime="Bun"
WORKDIR /app
ENV NODE_ENV="production"


FROM base AS build

COPY package.json .
COPY apps/api/package.json .
COPY bun.lock .

RUN bun install

COPY . .

RUN bun prisma generate --schema apps/api/prisma/schema.prisma
RUN bunx turbo build --filter api


FROM base

COPY --from=build /app /app

EXPOSE 4000
CMD [ "bun", "apps/api/build/index.js" ]
