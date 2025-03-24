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
- `/elements`: Element endpoints
- `/images`: Image endpoints
- `/projects`: Project endpoints
- [`/ws`](/apps/api/src/routes/ws): WebSocket endpoints

## Source Files

Here is select documentation about some of the files in the `/src` directory:

### `auth.ts`

Contains the configuration for [`better-auth`](https://github.com/elysiajs/better-auth).
Notably we here use the `customSession` plugin to return the `member` array with the user, everytime the session is fetched to make it easier to check the users role on the frontend.

### `headers.ts`

This sets security headers for the API. Most of the configuration is based on the [helmet](https://github.com/helmetjs/helmet) library.

### `schemas.ts`

Contains convenience `typebox` schemas for returning errors from the routes.

### `s3.ts`

Uses [bun's own `s3` module](https://bun.sh/docs/api/s3) to upload and download files from any s3 compatible object storage.

### `prisma.ts`

Sets up the prisma client, and provides a prisma client extension, that deletes the corresponding image from the s3 bucket, whenever an image record is deleted from the postgres database.
