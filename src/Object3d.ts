import { mat4, vec3 } from "gl-matrix";
import { Vec3, Vec2 } from "./types";
import { lerp3 } from "./utils";
import { v4 as uuidv4 } from "uuid";

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
  lerps?: boolean;
  uniforms?: any;
  dimensions?: Vec2;
};

type TTransform = { position?: Vec3; scale?: Vec3; origin?: "center" };

export default class Object3d {
  // stores the draw function returned by regl
  protected drawFunc: any;

  protected modelViewMatrix = mat4.create();

  protected origin: string | undefined;

  protected position: Vec3 = [0, 0, 0];
  protected targetPosition: Vec3 = [0, 0, 0];

  protected size: Vec3 = [1, 1, 1];
  protected targetSize: Vec3 = [1, 1, 1];

  protected dimensions: Vec2 = [1, 1];

  protected mouseover = false;
  protected updateFunctions: Array<() => void> = [];

  protected events: { [key: string]: (value: any) => void } = {};

  public id: string;

  constructor(props?: TObject3dProps) {
    this.id = uuidv4();

    if (props && props.lerps) {
      this.updateFunctions.push(this.lerpUpdate.bind(this));
      this.transform = this.transformLerp;
    } else {
      this.transform = this.transformDefault;
    }

    if (props && props.dimensions) {
      this.dimensions = props.dimensions;
    }
  }

  transform(props: TTransform) {}

  lerpUpdate() {
    this.position = lerp3(this.position, this.targetPosition, 0.1);
    this.size = lerp3(this.size, this.targetSize, 0.1);

    this.modelViewMatrix = mat4.create();

    this.translate(this.position);

    if (this.origin === "center" && this.position) {
      this.translate([this.dimensions[0] * 0.5, this.dimensions[1] * 0.5, 0]);
    }

    this.scale(this.size);

    if (this.origin === "center" && this.position) {
      this.translate([this.dimensions[0] * -0.5, this.dimensions[1] * -0.5, 0]);
    }
  }

  collides(point: Vec3) {
    const translation = mat4.getTranslation(
      vec3.create(),
      this.modelViewMatrix
    );

    const scaling = mat4.getScaling(vec3.create(), this.modelViewMatrix);

    if (
      point[1] >= translation[1] &&
      point[1] <= translation[1] + this.dimensions[1] * scaling[1] &&
      point[0] >= translation[0] &&
      point[0] <= translation[0] + this.dimensions[0] * scaling[0]
    ) {
      return true;
    }

    return false;
  }

  transformLerp({ position, scale, origin }: TTransform) {
    this.targetPosition = position || this.position;
    this.targetSize = scale || this.size;
    this.origin = origin;
  }

  transformDefault({ position, scale, origin }: TTransform) {
    const saveMatrix = origin === "center" && position;
    this.modelViewMatrix = mat4.create();

    this.targetPosition = position || this.position;
    this.position = this.targetPosition;
    this.translate(this.position);

    if (saveMatrix) {
      this.translate([0.5, 0.5, position![2]]);
    }

    this.targetSize = scale || this.size;
    this.size = this.targetSize;
    this.scale(this.size);

    if (saveMatrix) {
      this.translate([-0.5, -0.5, position![2]]);
    }
  }

  scale(size: Vec3) {
    this.modelViewMatrix = mat4.scale(
      mat4.create(),
      this.modelViewMatrix,
      size
    );
  }

  translate(position: Vec3) {
    this.modelViewMatrix = mat4.translate(
      mat4.create(),
      this.modelViewMatrix,
      position
    );
  }

  setSize(size: Vec3) {
    this.size = size;
    this.targetSize = size;
  }

  setPosition(position: Vec3) {
    this.position = position;
    this.targetPosition = position;
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

  dispatch(name: string, value: any) {
    if (typeof this.events[name] === "function") {
      this.events[name](value);
    }
  }

  on(event: string, cb: (value: any) => void) {
    this.events[event] = cb;
  }

  onclick(cb: (obj: Object3d) => void) {
    window.addEventListener("click", () => {
      if (this.mouseover && cb) {
        const boundCB = cb.bind(this);
        boundCB(this);
      }
    });
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

    this.updateFunctions.forEach(f => f());
  }

  draw(props: TViewProps) {
    this.drawFunc({
      ...props,
      modelViewMatrix: this.modelViewMatrix
    });
  }
}
