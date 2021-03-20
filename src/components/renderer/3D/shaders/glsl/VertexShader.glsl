# version 300 es

in vec3 a_position;
in vec3 a_color;

uniform mat4 worldMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

out vec4 fColor;

void main(void) {
    fColor = vec4(a_color, 1.0);
    gl_Position = projMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);
}  