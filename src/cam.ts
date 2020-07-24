import { mat4 } from "gl-matrix";
import { Vec3, Vec2 } from "./types";

export default class Camera {
  private gl: WebGLRenderingContext;
  private position: Vec3 = [0, 0, 0];
  private fov = Math.PI / 4;
  private up: Vec3 = [0, -1, 0];
  private target: Vec3 = [0, 0, 0];
  private viewAspect = 0;

  constructor(gl: WebGLRenderingContext, position?: Vec3) {
    this.gl = gl;
    if (position) {
      this.position = position;
    }
    this.viewAspect = this.gl.canvas.width / this.gl.canvas.height;
  }

  setPosition(position: Vec3) {
    this.position = position;
  }

  lookAt(target: Vec3) {
    this.target = target;
  }

  getViewSize(): [number, number] {
    const height = Math.abs(this.position[2] * Math.tan(Math.PI / 4 / 2) * 2);
    return [height * this.viewAspect, height];
  }

  unproject({
    position,
    size
  }: {
    position?: Vec3;
    size?: Vec3;
  }): { position: Vec3; size: Vec3 } {
    const viewSize = this.getViewSize();

    let scale: Vec3 = [1, 1, 1];
    let pos: Vec3 = [0, 0, 0];

    if (size) {
      scale = [
        (size[0] * viewSize[0]) / this.gl.canvas.width,
        (size[1] * viewSize[1]) / this.gl.canvas.height,
        size[2]
      ];
    }

    if (position) {
      let x = (position[0] * viewSize[0]) / this.gl.canvas.width;
      let y = (position[1] * viewSize[1]) / this.gl.canvas.height;

      pos = [x - viewSize[0] / 2, y - viewSize[1] / 2, position[2]];
    }

    return {
      position: pos,
      size: scale
    };
  }

  project() {
    const view = mat4.lookAt(
      mat4.create(),
      this.position,
      this.target,
      this.up
    );

    const projection = mat4.perspective(
      mat4.create(),
      this.fov,
      this.viewAspect,
      0.001,
      100
    );
    return { projection, view };
  }
}
