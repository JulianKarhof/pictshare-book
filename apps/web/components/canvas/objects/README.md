# Canvas Elements

The canvas elements are the things you can add to the canvas.
All of them are based on a `DisplayElement` class in the `element.ts` file.
The circle class is currently the class with the smallest implementation footprint,
so it is a good way of seeing how easy it is to create new elements that can be added to the canvas.

## Elements

Here's a short overview of each available element:

### DisplayElement

The `DisplayElement` class extends pixijs's [`Container`](https://pixijs.com/8.x/guides/components/containers) class.
This way it can be added as a child or parent to any other pixijs object.
On top of the basic properties inherited from the container class,
it provides a bunch of basic functionality that all elements on the canvas need:

It creates a temporary id while waiting for a proper element id from the server.

Provides a seperate way of storing width and height. Because of [the way pixijs handles these](https://pixijs.com/8.x/guides/components/sprites?_highlight=height#scale-vs-width--height)
through the scale parameter, this provides a better way of accessing the current dimensions in pixels without actually changing the scale.
We usually need to access this in the inherited classes to draw the element in the correct size.

It provides an update function that is meant to be called from the implementing class.
The update function updates a bunch of parameters at once
and is used to make it easier to update the element from the data received through websocket and api communication.

It also provides a way of serializing and deserializing the element through the `toJSON` and `fromJSON` methods.
The `baseToJSON` method serializes all properties that are needed to recreate the basic element, while the
`toJSON` function is meant to be overridden by the implementing class to serialize additional properties.

The `draw` function is being called at the end of the constructor
and is meant to be overridden by the implementing class to draw the element.

#### ElementFactory

The factory class included in the same `element.ts` file is a convenient way of creating new instances of the elements
from the JSON data received from the backend. It also ensures typesafety while doing so by checking if the type of element
has been registered to the factory and returning the correct constructor.

### Shape

Provides one more abstraction layer over the `DisplayElement` class, to make it easier to create basic shapes.
The class provides things like a `fill` and `stroke` color and a `lineWidth` property.

#### Circle

Calculates the radius from the height / width of the element and draws it.

#### Rectangle

Accepts a `cornerRadius` property to create rounded corners (currently no way to change this in the frontend).

### Image

Takes in a src url and uses the [`AssetManager`](/apps/web/components/canvas/managers#assetmanager) to load the image, falling back to a placeholder if loading fails.
The class also keeps track of the images original aspect ratio to undo any streching (not implemented in the ui).

### Text

The `Text` element takes in a number of properties like `content`, `fontSize` and `fontFamily` to customize rendering of a pixi.js text element. Pixi.js renders text by loading the text onto the dom and taking a screenshot of it to render onto the canvas as a sprite. This makes the rendering accurate not just to the browser, but also the operating system the browser is running on, since small differences in the hardware and software can cause slight variations in the rendering.

For editing, once double clicked, the `Text` element tracks the position of the text on the canvas and layers a html input element over it, transforming world- to screen-space coordinates.
The element on the canvas is made invisible and only the input element is rendered, keeping in mind the current zoom level, which makes it seems like the input element is part of the canvas.
Since the rendering of pixi.js is accurate to the dom, this is almost undetectable.

### Drawing

The `Drawing` element is created by the [`DrawManager`](/apps/web/components/canvas/managers#drawmanager) which provides the points, the style and the element position on the canvas, once the user is finished drawing a stroke.
The element uses pixijs's `bezierCurveTo` method to draw the stroke, by setting the curve handles to the point between the previous and current, and the current and next point respectively.
If there are exactly two points, it draws a straight line between them.
The element also draws an invisible stroke with a larger width above the first line, to make grabbing the element easier, acting as a hitbox.
