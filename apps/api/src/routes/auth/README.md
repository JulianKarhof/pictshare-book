# Authentication

The authentication endpoints are managed by the [better-auth](https://github.com/elysiajs/better-auth) library.
You can see its configuration in the [auth.ts](https://github.com/JulianKarhof/pictshare-book/blob/master/apps/api/src/auth.ts) file.

There is also a middleware for easily protecting routes, which can be found in the middleware directory.

In `auth.service.ts` the `AuthService` currently only has one method, `hasProjectAccess` which is used to check if a user has access and/or a specific role in a certain project.
