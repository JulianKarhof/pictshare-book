# Development

Pictshare Book is setup as a monorepo, to make setup easier and facilitate type sharing between packages.

It currently just includes the two main packages you would expect:

- [`apps/web`](/apps/web): The nextjs based web frontend
- [`apps/api`](/apps/api): The elysiajs based REST api

To make development easier, we use docker-compose to run the `postgres` and `redis` database as well as an s3 compatible storage service called `MinIO`.

## Commands

Here are a few useful commands (for a complete list, see the [package.json](https://github.com/JulianKarhof/pictshare-book/blob/master/package.json)):

- `bun install`: Install dependencies
- `bun run db`: Run database services (postgres, redis, minio)
- `bun run generate`: Generate Prisma client
- `bun run setup`: Run all setup commands and setup .env files
- `bun run test`: Run all tests
- `bun run check`: Run the linter and formatter

## Code Quality

To ensure code quality and maintainability we use the following:

- [Husky](https://github.com/typicode/husky) to enforce commit hooks and pre-push checks
- [Biome](https://biomejs.dev/) for code formatting and linting
- Tests to ensure functionality ([read more](/docs/testing.md))
