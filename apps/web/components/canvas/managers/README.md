# Manager Classes

The manager classes in this folder are where most of the fronends canvas drawing logic lives.
The classses all have seperate responsibilities and get composed together in the `stage-manager.ts` file.
The manager classes have been refactored to be easily describable within a few sentences, to keep each one to
as few responsibilities as possible.

Following is an overview over each of the classes functionalities and implementation details:

## StageManager

The `StageManager` class initializes all the other managers, and creates the pixi.js stage.
It is mostly a wrapper class that just forwards certain methods, and handles creation and destruction of elements on the canvas.
It is also responsible for preloading a few assets, loading the canvas state, and updating the elements on the canvas using
the display element update method, as mentioned [here](/apps/web/components/canvas/objects/#displayelement).

## AssetManager

The `AssetManager` exists to make it easier to load and manage images from react and pixi.js simultaneously.
For this purpose it includes a react hook that can be used to load images and get updates from react
and a listener to get updates from the pixi.js side. This is needed to ensure that images don't need to be loaded twice,
since we display the images on the canvas and in the `ImageDrawer` component.

## CursorManager

The `CursorManager` is used to display multiplayer cursors from other users on the canvas.
It gets updates from the websocket manager, and displays a cursor with the users name for each person connected to the canvas.
It also smoothes the transition between each update to make the cursor movement more natural.

## DragManager

The `DragManager` is used to handle dragging of elements on the canvas.
It sends updates via websocket while dragging and a final update
when the drag is finished. The final update is also sent via the normal rest api to update the database.
T

## DrawManager

The `DrawManager` handles drawing on the canvas. It creates a new `Drawing` object once the user is finished drawing a stroke,
and includes the visual stroke data like the stroke points, color, and width. (currently the color and width can't be changed from the frontend)
It also simplifies the stroke points using the [`simplify.js`](https://mourner.github.io/simplify-js/) library.
Finally, the `DrawManager` also calculates the bounds of the stroke after drawing to properly set the position of the `Drawing` object.

## TransfomerManager

The `TransformerManager` draws the transformer around the currently selected element.
The transformer includes the blue outline and the resize handles. The transformer is resized constantly so that
the handles and the line take up the same amount of pixels on the screen no matter the zoom level. (see the `scaleFactor`)

When resizing, the transformer handles keeping the object in one place, and updating the transformer visuals themselves,
as well as sending updates while resizing via websocket and to the rest api once resizing is finished.

The transformer manager also handles the logic for a bunch of keyboard shortcuts, which are listed in the features [here](/docs/features.md#resizing)

## ViewportManager

The `ViewportManager` contains the logic for initializing the viewport and drawing the grid pattern in the background.
It mostly wraps the [`pixi-viewport`](https://github.com/pixijs-userland/pixi-viewport) library, that handles the pan and zoom functionality,
extended with the `drag-zoom-plugin.ts` file in the helpers folder, which handles using a trackpad for zooming and panning.
The class generates new grid tiles on the fly, based on the current zoom level, and discards the ones that are not longer used.
The resolution for  the tiles is adjusted dynamically to prevent the tiles from getting too big and lagging the canvas.

## WebsocketManager

The `WebsocketManager` class is a singleton that is responsible for all interactions with the websocket server.
It handles sending and receiving updates, retrying using a message queue, and manages
the connection, including reconnecting and handling errors.
