import { Filter, GlProgram } from "pixi.js";
import fragment from "./grid.frag";
import vertex from "./grid.vert";

export class GridFilter extends Filter {
  constructor({
    lineThickness,
    color,
    width,
    height,
    pitch,
  }: {
    lineThickness: number;
    color: number[];
    width: number;
    height: number;
    pitch: { x: number; y: number };
  }) {
    const glProgram = GlProgram.from({
      vertex,
      fragment,
      name: "grid-filter",
    });

    const uniforms = {
      thickness: { value: lineThickness, type: "f32" },
      color: { value: [...color, 1.0], type: "vec4<f32>" },
      vpw: { value: width * 2, type: "f32" },
      vph: { value: height * 2, type: "f32" },
      offset: { value: [0, 0], type: "vec2<f32>" },
      pitch: { value: [pitch.x * 2, pitch.y * 2], type: "vec2<f32>" },
    };

    super({
      glProgram,
      antialias: true,
      resources: { uniforms },
    });
  }
}
