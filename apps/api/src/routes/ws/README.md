# Websocket

## Overview

The websocket route handles all the syncing operations between the different clients. It takes in `Events`, which are typed as can be seen in `ws.schema.ts`, and distributes them via Redis (if available) to the other clients.

## Schema

All websocket messages adhere to the schema defined in `ws.schema.ts`, and look like this:

```json
{
  "type": "EVENT_TYPE",
  "timestamp": 1634567890,
  "userId": "some_user_id",
  "payload": {
    "key": "value"
  }
}
```

The userId is used to identify the user who sent the message. Currently, this is used only for the `CURSOR_SYNC` event, but may be used in the future to e.g. highlight the object that the user is currently interacting with.

## Authentication

The websocket route checks authentication only when establishing a connection, to prevent overhead when actually sending messages.
This opens a small security risk, as the client can still send authenticated websocket messages if the owner of the project removes them while the session is still active.
Ideally, when the user is removed from the project, the websocket connection should be closed, but this is not currently implemented.
This is only a minor issue, because the REST API, which does the actual updates to the canvas, needs an authentication token for every request, so the client could visually spam the websocket route, but never actually update the canvas.

## Distribution

Messages are distributed to all clients connected to the current server, except the one that sent the message.
If a redis url is provided, the messages are also distributed to all other servers, where they are sent to the rest of the clients connected to those servers. (see `ws.service.ts`)
Each server generates a unique identifier (see `config.ts` in the `src` folder) that is used to prevent the message from being received by the sending server.
Because we are using uuid7 for this, which is timestamp based, the chances of a collision are near zero.

## Logging

Messages are logged on every incoming request for debugging in development, but in production the messages that represent in-between updates (`FRAME_UPDATE` & `CURSOR_SYNC`) are not logged, to make the logs more readable.

## Ensuring Recency

In-between messages that are older than 5 seconds are discarded to ensure that the client doesn't lag behind when sending messages.
This was originally set to 1 second, but it turns out some devices clocks are off the current time by a few seconds, so their updates would be discarded even though they are still relevant.
