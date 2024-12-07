precision mediump float;

uniform float vpw;
uniform float vph;
uniform float thickness;

uniform vec2 offset;
uniform vec2 pitch;
uniform vec4 color;

void main() {
    float offX = (offset[0]) + gl_FragCoord.x;
    float offY = (offset[1]) + (vph - gl_FragCoord.y);
    float rX = min(abs(pitch[0] - mod(offX, pitch[0])),
            abs(mod(offX, pitch[0])));
    float rY = min(abs(pitch[1] - mod(offY, pitch[1])),
            abs(mod(offY, pitch[1])));
    if (int(rX) <= int(thickness / 2.0) ||
            int(rY) <= int(thickness / 2.0)) {
        gl_FragColor = color;
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
