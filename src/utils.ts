import { Vec2, Vec3 } from "./types";
import Camera from "./cam";
import Img from "./Image";

const lerp = require("lerp");

export const lerp3 = (from: Vec3, to: Vec3, time: number): Vec3 => {
  return [
    lerp(from[0], to[0], time),
    lerp(from[1], to[1], time),
    lerp(from[2], to[2], time),
  ];
};

export const lerp2 = (from: Vec2, to: Vec2, time: number): Vec2 => {
  return [lerp(from[0], to[0], time), lerp(from[1], to[1], time)];
};

export const toClipspace = (pos: Vec2, resolution: Vec2): Vec2 => {
  return [(pos[0] / resolution[0]) * 2 - 1, (pos[1] / resolution[1]) * 2 - 1];
};

export const createWebglImg = (
  img: HTMLImageElement,
  camera: Camera,
  dpr: number,
  regl: any,
  lerps?: boolean
) => {
  img.style.opacity = "0";
  const bbox = img.getBoundingClientRect();

  const { position, size } = camera.unproject({
    position: [bbox.x * dpr, bbox.y * dpr, 0],
    size: [bbox.width * dpr, bbox.height * dpr, 1],
  });

  const image = new Img({
    regl,
    position,
    dimensions: [size[0], size[1]],
    src: img,
    lerps,
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
