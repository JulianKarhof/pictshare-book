#version 300 es
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uAlpha;
uniform vec3 uColor;
uniform vec2 uOffset;

uniform vec4 uInputSize;

void main(void) {
    // Sample the shadow texture
    vec4 shadowSample = texture(uTexture, vTextureCoord - uOffset * uInputSize.zw);

    // Premultiply alpha for the shadow
    shadowSample.rgb = uColor.rgb * shadowSample.a;

    // Apply user alpha to the shadow
    shadowSample *= uAlpha;

    // Sample the original texture
    vec4 originalSample = texture(uTexture, vTextureCoord);

    // Blend the original texture on top of the shadow
    finalColor = mix(shadowSample, originalSample, originalSample.a);
}
