module.exports =
`
attribute vec2 VERTEX;
attribute vec4 COLOR;
uniform mat4 P_MAT;
uniform mat4 M_MAT;

void main() {
  vec4 position = vec4(VERTEX.x, VERTEX.y, 0.0, 1.0);
  gl_Position = P_MAT * M_MAT * position;
}
`;
