# Services

This directory contains the `StageService` class, used for interacting with the api.

## StageService

The `StageService` class provides methods for most of the interactions with the backend.
It mostly exists to send requests via websocket and the REST API at the same time.
This is done so that even if the websocket connection should fail, the most important data still gets saved to the database via the REST endpoints.

The class also rate limits the requests going out via the websockets, to ensure that the other clients aren't overwhelmed with updates to the canvas.
This is currently only done on the client side, but since the only thing achieved by spamming the websocket endpoint is that the other clients canvases get slower updates, the attack is only limited to a single canvas, and the attacking user can just be removed from the current canvas by the owner, this is not a significant security risk.

The `sendCreate` method also importantly returns the id of the created element, so that the [`StageManager`](/apps/web/components/canvas/managers/#stagemanager) can update the element with the id from the server, so that all updates going forth can be done with the correct id.
