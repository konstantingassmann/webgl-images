import { Vec2, Vec3 } from "./types";
import Camera from "./cam";
import Img from "./Image";

const lerp = require("lerp");

export const lerp3 = (from: Vec3, to: Vec3, time: number): Vec3 => {
  return {
    x: lerp(from.x, to.x, time),
    y: lerp(from.y, to.y, time),
    z: lerp(from.z, to.z, time),
  };
};

export const vecToArray = (vector: Vec3 | Vec2): Float32Array => {
  const arr = [vector.x, vector.y];

  if ((vector as Vec3).z !== undefined) {
    arr[2] = (vector as Vec3).z;
  }
  return new Float32Array(arr);
};

export const lerp2 = (from: Vec2, to: Vec2, time: number): Vec2 => {
  return {
    x: lerp(from.x, to.x, time),
    y: lerp(from.y, to.y, time),
  };
};

export const toClipspace = (pos: Vec2, resolution: Vec2): Vec2 => {
  return {
    x: (pos.x / resolution.x) * 2 - 1,
    y: (pos.y / resolution.y) * 2 - 1,
  };
};

export const createWebglImg = (
  img: HTMLImageElement,
  camera: Camera,
  dpr: number,
  regl: any
) => {
  img.style.opacity = "0";
  const bbox = img.getBoundingClientRect();

  const { position, size } = camera.unproject({
    position: { x: bbox.x * dpr, y: bbox.y * dpr, z: 0 },
    size: { x: bbox.width * dpr, y: bbox.height * dpr, z: 1 },
  });

  const image = new Img({
    regl,
    position,
    dimensions: { x: Math.floor(size.x), y: Math.floor(size.y) },
    src: img,
  });

  return image;
};

type Tsmooth = Array<number> | number;
export type TSmoothValue<T> = {
  target: T;
  current: T;
  value: T;
  update: () => void;
};

export const smoothValue = <T extends Tsmooth>(
  initial: T,
  time: number
): TSmoothValue<T> => {
  let lerpFunc = (a: T, b: T, t: number) => {
    return lerp(a, b, t);
  };
  if (Array.isArray(initial)) {
    lerpFunc = (a: T, b: T, t: number) => {
      const start = [...(a as Array<number>)];
      const end = [...(b as Array<number>)];
      for (let i = 0; i < start.length; i++) {
        start[i] = lerp(start[i], end[i], t);
      }
      return start;
    };
  }
  return {
    target: initial,
    current: initial,
    get value(): T {
      return this.current;
    },
    set value(v: T) {
      this.target = v;
    },
    update() {
      this.current = lerpFunc(this.current, this.target, time);
    },
  };
};
