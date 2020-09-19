import Camera from "./cam";
import { lerp3, toClipspace, createWebglImg, smoothValue } from "./utils";
import { Vec3, Vec2 } from "./types";
import Img from "./Image";
import Scene from "./Scene";
const reglLib = require("regl");

const canvas = document.querySelector("#paper") as HTMLCanvasElement;
const dpr = window.devicePixelRatio;
const w = window.innerWidth * dpr;
const h = window.innerHeight * dpr;
canvas.width = w;
canvas.height = h;
canvas.style.height = `${window.innerHeight}px`;
canvas.style.width = `${window.innerWidth}px`;

const gl = canvas.getContext("webgl") as WebGLRenderingContext;

const camera = new Camera(gl, [0, 0, -50]);

const regl = reglLib(gl);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.FRONT);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.BLEND);
gl.disable(gl.DEPTH_TEST);

const world = new Scene();

let state: Array<{ id: string; open: boolean }> = [];

const getIdx = (id: string) => {
  return state.findIndex((s) => s.id === id);
};

const fromState = (id: string) => {
  const idx = getIdx(id);
  return state[idx];
};

Promise.all(
  Array.from(document.querySelectorAll("img")).map((img) => {
    return new Promise<HTMLImageElement>((resolve) => {
      if (!img.complete) {
        img.onload = () => {
          resolve(img);
        };
        return;
      }
      resolve(img);
    });
  })
).then((imgs: Array<HTMLImageElement>) => {
  imgs.forEach((img) => {
    const image = createWebglImg(img, camera, dpr, regl, true);
    image.setZoom(1.2);
    image.on("hover", (over) => {
      let open = fromState(image.id).open;
      if (!open) {
        image.setZoom(over ? 1.25 : 1.2);
      }
    });
    state.push({ id: image.id, open: false });
    world.add(image);
  });

  const { size } = camera.unproject({
    size: [gl.canvas.width, gl.canvas.height, 1],
  });

  world.on("click", (obj: Img) => {
    let open = fromState(obj.id).open;
    const idx = getIdx(obj.id);

    const newPos: Vec3 = [...obj.getPosition()];

    if (open) {
      obj.setZoom(1.2);
      obj.transform({
        scale: [1, 1, 1],
        origin: "center",
        position: newPos,
      });
      open = false;
      world.getChildren().forEach((child) => child.setOpacity(1));
    } else {
      const dims = obj.getDimensions();
      obj.setZoom(1);
      obj.transform({
        scale: [size[1] / dims[1], size[1] / dims[1], 1],
        origin: "center",
        position: newPos,
      });
      open = true;
      world
        .getChildren()
        .filter((child) => child.id !== obj.id)
        .forEach((child) => child.setOpacity(0));
    }
    state[idx].open = open;
  });
});

let dragging = false;
let mouse = [0, 0];
let cursor: Vec3 = [0, 0, 0];
let dragOffset: Vec3 = [0, 0, -50];
let cameraPosition: Vec3 = [0, 0, -50];
let lastMouse = [0, 0];
const velocity = smoothValue<Vec2>([0, 0], 0.1);

world.on("mousedown", (e) => {
  dragging = true;
  mouse = toClipspace(
    [e.clientX, e.clientY],
    [window.innerWidth, window.innerHeight]
  );
  lastMouse = mouse;
});

world.on("mousemove", (e) => {
  const projectedMouse = camera.unproject({
    position: [e.clientX * dpr, e.clientY * dpr, 0],
  }).position;

  cursor = [
    projectedMouse[0] + cameraPosition[0],
    projectedMouse[1] + cameraPosition[1],
    projectedMouse[2],
  ];

  if (dragging) {
    const m = toClipspace(
      [e.clientX, e.clientY],
      [window.innerWidth, window.innerHeight]
    );

    dragOffset = [
      dragOffset[0] - (m[0] - mouse[0]) * 20,
      dragOffset[1] - (m[1] - mouse[1]) * 20,
      -50,
    ];

    lastMouse = mouse;
    mouse = m;
  }
});

world.on("mouseup", () => {
  dragging = false;
});

regl.frame(({ time }: { time: number }) => {
  cameraPosition = lerp3(cameraPosition, dragOffset, 0.1);
  velocity.value = [lastMouse[0] - mouse[0], lastMouse[1] - mouse[1]];
  velocity.update();

  camera.setPosition(cameraPosition);
  camera.lookAt([cameraPosition[0], cameraPosition[1], 0]);

  const { projection, view } = camera.project();
  document.body.style.cursor = dragging ? "grabbing" : "grab";

  world.update({ projection, view, time }, cursor);

  regl.clear({
    color: [0, 0, 0, 0],
    depth: 1,
  });

  world.draw({ projection, view, time, velocity: velocity.value });
});
