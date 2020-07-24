import { mat4, vec3 } from "gl-matrix";

export const camera = (
  gl: WebGLRenderingContext,
  p: Array<number>,
  projectFunction: "perspective" | "canvas" = "canvas"
) => {
  const fov = Math.PI / 4;

  const up = vec3.clone(new Float32Array([0, -1, 0]));

  const cameraPos = vec3.clone(new Float32Array(p));

  const target = vec3.create();

  const view = mat4.lookAt(mat4.create(), cameraPos, target, up);

  const projection = {
    perspective: () => {
      return mat4.perspective(
        mat4.create(),
        fov,
        gl.canvas.width / gl.canvas.height,
        0.001,
        100
      );
    },
    canvas: () => {
      return mat4.clone([
        2 / gl.canvas.width,
        0,
        0,
        0,
        0,
        -2 / gl.canvas.height,
        0,
        0,
        0,
        0,
        2 / 100,
        0,
        -1,
        1,
        0,
        1
      ]);
    }
  }[projectFunction]();

  return {
    projection,
    view
  };
};
