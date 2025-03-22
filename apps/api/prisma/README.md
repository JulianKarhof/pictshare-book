# Database

This project uses Prisma ORM to simplify interactions with the database, as well as provide a safe way of migrating the database schema.

## Diagram

![Database Diagram](/assets/db-diagram.png)

## Schema

> [!IMPORTANT]
> Most of the schemas for authentication (`User`, `Verification`, `Session`, `Account`) are given by `better-auth` [here](https://www.better-auth.com/docs/concepts/database#core-schema).
The `User` schema has been customized to include a few additional fields.

Here's a rough overview of some of the decisions made when designing the database schema:

### `Element`

The `Element` type represents any element on the canvas. It links to the `Image` `Text` and `Shape` types.
Only one of those three can ever be set, but this can't be enforced on the database level.
This type could've been implemented as a JSON type in postgres, but i wanted to be able to query objects by zIndex or position with high performance.

### `Shape`

The `Shape` type encompasses anything that has a `fill` and `stroke`. Currently that includes the `Circle`, `Drawing` and `Rectangle` elements.

### `Member`

The `Member` type represents a user inside of a canvas. It includes the `userId` and `canvasId` together as a composite primary key and a `role` field.

### `Image` & `ImageAsset`

The `ImageAsset` type contains the data to access an image on the s3 storage, uploaded by a `User` to a `Project`.
It can also be directly accessed from either the `User` or `Project` type.

Crucially an ImageAsset is a representation of the file itself and not the image on the canvas, which is what the `Image` type is for.
Therefore there can be multiple `Images` with the same `ImageAsset`.

### `Project`

The `Project` has a few different names in the codebase and documentation. It is mostly referred to as either `Canvas` or when user facing as `Book`.
