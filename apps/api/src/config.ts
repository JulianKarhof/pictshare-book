import { randomUUIDv7 } from "bun";

export const PORT = process.env.PORT || 4000;
export const SERVER_ID = randomUUIDv7();
export const SHORT_SERVER_ID = SERVER_ID.substring(0, 8);
