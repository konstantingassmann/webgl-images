import { mat4, vec3 } from "gl-matrix";
import { Vec3, Vec2 } from "./types";
import { v4 as uuidv4 } from "uuid";
import { vecToArray } from "./utils";

export type TViewProps = {
  projection: mat4;
  view: mat4;
  time: number;
};

export type TObject3dProps = {
  regl: any;
  position?: Vec3;
  scale?: Vec3;
  frag?: string;
  vert?: string;
  uniforms?: any;
  dimensions?: Vec2;
};

type TTransform = { position?: Vec3; scale?: Vec3; origin?: "center" };

export default class Object3d {
  // stores the draw function returned by regl
  protected drawFunc: any;

  protected modelViewMatrix = mat4.create();

  protected origin: string | undefined;

  public position: Vec3 = { x: 0, y: 0, z: 0 };

  public size: Vec3 = { x: 1, y: 1, z: 1 };

  protected dimensions: Vec2 = { x: 1, y: 1 };

  protected opacity = 1;

  public mouseover = false;
  protected updateFunctions: Array<() => void> = [];

  protected events: { [key: string]: (value?: any) => void } = {};

  public id: string;

  constructor(props?: TObject3dProps) {
    this.id = uuidv4();

    if (props && props.dimensions) {
      this.dimensions = props.dimensions;
    }

    this.calcModelViewMatrix();
  }

  collides(point: Vec3) {
    const translation = mat4.getTranslation(
      vec3.create(),
      this.modelViewMatrix
    );

    const scaling = mat4.getScaling(vec3.create(), this.modelViewMatrix);

    if (
      point.y >= translation[1] &&
      point.y <= translation[1] + this.dimensions.y * scaling[1] &&
      point.x >= translation[0] &&
      point.x <= translation[0] + this.dimensions.x * scaling[0]
    ) {
      return true;
    }

    return false;
  }

  calcModelViewMatrix() {
    const saveMatrix = this.origin === "center";
    this.modelViewMatrix = mat4.create();

    this.position = this.position;
    this.translate(this.position);

    if (saveMatrix) {
      this.translate({
        x: this.dimensions.x * 0.5,
        y: this.dimensions.y * 0.5,
        z: this.position.z,
      });
    }

    this.size = this.size;
    this.scale(this.size);

    if (saveMatrix) {
      this.translate({
        x: this.dimensions.x * -0.5,
        y: this.dimensions.y * -0.5,
        z: this.position.z,
      });
    }
  }

  scale(size: Vec3) {
    this.modelViewMatrix = mat4.scale(
      mat4.create(),
      this.modelViewMatrix,
      vecToArray(size)
    );
  }

  translate(position: Vec3) {
    this.modelViewMatrix = mat4.translate(
      mat4.create(),
      this.modelViewMatrix,
      vecToArray(position)
    );
  }

  setSize(size: Vec3) {
    this.size = size;
  }

  setPosition(position: Vec3) {
    this.position = position;
  }

  setOpacity(opacity: number) {
    this.opacity = opacity;
  }

  getOpacity() {
    return this.opacity;
  }

  getPosition() {
    return this.position;
  }

  getSize() {
    return this.size;
  }

  getDimensions() {
    return this.dimensions;
  }

  dispatch(name: string, value?: any) {
    if (typeof this.events[name] === "function") {
      this.events[name](value);
    }
  }

  on(event: string, cb: (value: any) => void) {
    this.events[event] = cb;
  }

  update(props: TViewProps, cursor: Vec3) {
    if (this.collides(cursor)) {
      document.body.style.cursor = "pointer";
      const changed = !this.mouseover;
      this.mouseover = true;

      if (changed) {
        this.dispatch("hover", this.mouseover);
      }
    } else {
      const changed = this.mouseover;
      this.mouseover = false;

      if (changed) {
        this.dispatch("hover", this.mouseover);
      }
    }

    this.updateFunctions.forEach((f) => f());
    this.calcModelViewMatrix();
  }

  draw(props: TViewProps) {
    this.drawFunc({
      ...props,
      modelViewMatrix: this.modelViewMatrix,
    });
  }
}
