import { Filter, GlProgram } from "pixi.js";
import fragment from "./fragment.frag";
import vertex from "./vertex.vert";

const glProgram = GlProgram.from({
  vertex,
  fragment,
  name: "drop-shadow-filter",
});

export const dropShadowFilter = new Filter({
  glProgram,
  antialias: true,
  padding: 10,
  resources: {
    dropShadowUniforms: {
      uAlpha: {
        value: 1,
        type: "f32",
      },
      uColor: {
        value: [0, 0, 0],
        type: "vec3<f32>",
      },
      uOffset: {
        value: [10, 10],
        type: "vec2<f32>",
      },
    },
  },
});
