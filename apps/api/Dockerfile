# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"


FROM base as build

RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 openssl

COPY package.json ./
RUN npm install --include=dev

COPY . .

RUN npm run build
RUN npm prune --omit=dev


FROM base

RUN apt-get update -qq && \
  apt-get install -y openssl

COPY --from=build /app /app

EXPOSE 4000
CMD [ "node", "build/index.js" ]
