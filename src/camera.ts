import { mat4 } from "gl-matrix";
import { vecToArray } from "./utils";
import { Vec3 } from "./types";

export default class Camera {
  private gl: WebGLRenderingContext;
  private position: Vec3 = { x: 0, y: 0, z: 0 };
  private fov = Math.PI / 4;
  private up: Vec3 = { x: 0, y: -1, z: 0 };
  private target: Vec3 = { x: 0, y: 0, z: 0 };
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
    const height = Math.abs(this.position.z * Math.tan(Math.PI / 4 / 2) * 2);
    return [height * this.viewAspect, height];
  }

  unproject({
    position,
    size,
  }: {
    position?: Vec3;
    size?: Vec3;
  }): { position: Vec3; size: Vec3 } {
    const viewSize = this.getViewSize();

    let scale: Vec3 = { x: 1, y: 1, z: 1 };
    let pos: Vec3 = { x: 0, y: 0, z: 0 };

    if (size) {
      scale = {
        x: (size.x * viewSize[0]) / this.gl.canvas.width,
        y: (size.y * viewSize[1]) / this.gl.canvas.height,
        z: size.z,
      };
    }

    if (position) {
      let x = (position.x * viewSize[0]) / this.gl.canvas.width;
      let y = (position.y * viewSize[1]) / this.gl.canvas.height;

      pos = {
        x: x - viewSize[0] / 2,
        y: y - viewSize[1] / 2,
        z: position.z,
      };
    }

    return {
      position: pos,
      size: scale,
    };
  }

  project() {
    const view = mat4.lookAt(
      mat4.create(),
      vecToArray(this.position),
      vecToArray(this.target),
      vecToArray(this.up)
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
