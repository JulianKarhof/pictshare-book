# Backend

The Pictshare Book backend consists of a RESTful API and a WebSocket server, both implemented using Elysia.js.
For documentation of the REST endpoints, see the [API Reference](https://api.book.pict.sh/docs).

## Stack

The backend is built using the following technologies:

- [Bun](https://bun.sh/) as the runtime environment
- [Elysia.js](https://elysiajs.com/) as the web framework
- [Prisma](https://prisma.io/) as the ORM
- [PostgreSQL](https://www.postgresql.org/) as the database
- [Redis](https://redis.io/) as the pubsub service
- [S3 Compatible Storage](https://aws.amazon.com/s3/) ([MinIO](https://github.com/minio/minio) locally and [Tigris](https://tigrisdata.com/) in the cloud) for storing images.

## Overview

The backend is built on elysia.js, a fast and type-safe web framework for Bun. It was chosen mainly for its end-to-end type safety using its tRPC-like [`eden-treaty`](https://elysiajs.com/eden/treaty/overview.html) and its performance, which is amplified by it using bun.

In the implementation, its main differences compared to express are that every route specifies types for the request and response using [`typebox`](https://elysiajs.com/essential/validation.html#typebox).
This makes it easy to validate data on the frontend and backend, and prevents duplicated code.
This also has the added benefit of making it really easy to generate a [OpenAPI](https://swagger.io/specification/) specification from the code, with only a bit of extra work and configuration.

### Routes

Here are the routes of the backend:

- [`/auth`](/apps/api/src/routes/auth): Authentication endpoints (using [better-auth](https://github.com/elysiajs/better-auth))
- [`/elements`](/apps/api/src/routes/elements): Element endpoints
- [`/images`](/apps/api/src/routes/images): Image endpoints
- [`/projects`](/apps/api/src/routes/projects): Project endpoints
- [`/ws`](/apps/api/src/routes/ws): WebSocket endpoints
