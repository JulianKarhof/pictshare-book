# Testing

To ensure the quality of this codebase and maintainability, we use a variety of tests on the frontend and backend.

## Frontend Testing

To run frontend tests, use the following command:
```bash
bun run test:web
```

We use playwright to test our frontend. This isn't trivial, as it requires taking screenshots of the canvas and comparing them to previous versions.
If something in the codebase changes the visuals of the canvas, the screenshots need to be manually checked and updated.
For this reason we try to keep the amount of canvas tests at a minimum to ensure the overhead is kept low, while still ensuring functionality.


To update all screenshots, after being sure the behavior is as expected, run the following command:
```bash
bun run test:update-screenshots
```

## Backend Testing

To run backend tests, use the following command:
```bash
bun run test:api
```

We use the bun test runner to test our backend routes. Elysia makes it easy to test routes individually and mock dependencies.
