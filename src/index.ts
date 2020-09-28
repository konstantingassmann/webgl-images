import Camera from "./cam";
import { lerp3, toClipspace, createWebglImg, smoothValue } from "./utils";
import { Vec3, Vec2 } from "./types";
import Img from "./Image";
import Scene from "./Scene";
const reglLib = require("regl");
import anime from "animejs/lib/anime.es.js";

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

let progress = 0;

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
    const image = createWebglImg(img, camera, dpr, regl);

    const onhover = (over: boolean) => {
      let open = fromState(image.id).open;

      if (open) {
        return;
      }

      const aprops = {
        zoom: image.getZoom(),
      };

      anime({
        targets: aprops,
        zoom: over ? 1.25 : 1.2,
        easing: "easeOutQuad",
        duration: 500,
        update: function () {
          image.setZoom(aprops.zoom);
        },
      });
    };
    image.on("hover", onhover);
    state.push({ id: image.id, open: false });
    world.add(image);
    onhover(false);
  });

  const { size } = camera.unproject({
    size: [gl.canvas.width, gl.canvas.height, 1],
  });

  world.on("click", (obj: Img) => {
    const openImage = state.some((element) => element.open);

    let open = fromState(obj.id).open || openImage;

    if (openImage) {
      const openEl = state.find((element) => element.open);
      if (openEl) {
        obj = world
          .getChildren()
          .find((child) => child.id === openEl.id) as Img;
      }
    }

    const idx = getIdx(obj.id);

    const newPos: Vec3 = [...obj.getPosition()];

    const objSize = obj.getSize();

    const childs = world.getChildren().filter((child) => child.id !== obj.id);

    const tlprops = {
      zoom: obj.getZoom(),
      opacity: 1,
      scaleX: objSize[0],
      scaleY: objSize[1],
      scaleZ: objSize[2],
      progress: 1,
    };

    const tl = anime.timeline();

    if (open) {
      tlprops.opacity = 0;
      tl.add({
        targets: tlprops,
        zoom: 1.2,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        easing: "easeOutQuad",
        duration: 300,
        update: () => {
          obj.setZoom(tlprops.zoom);
          obj.transform({
            scale: [tlprops.scaleX, tlprops.scaleY, tlprops.scaleZ],
            position: newPos,
          });
        },
      }).add({
        targets: tlprops,
        opacity: 1,
        easing: "easeOutQuad",
        duration: 300,
        update: () => {
          childs.forEach((child) => child.setOpacity(tlprops.opacity));
        },
      });

      open = false;
    } else {
      const dims = obj.getDimensions();

      const zero = toClipspace([0, 0], [window.innerWidth, window.innerHeight]);

      newPos[0] = -20;
      newPos[1] = -20;

      tl.add({
        targets: tlprops,
        opacity: 0,
        easing: "easeOutQuad",
        duration: 300,
        update: () => {
          childs.forEach((child) => child.setOpacity(tlprops.opacity));
        },
      }).add(
        {
          targets: tlprops,
          zoom: 1,
          scaleX: size[1] / dims[1],
          scaleY: size[1] / dims[1],
          scaleZ: 1,
          progress: 0,
          easing: "easeOutQuad",
          duration: 300,
          update: () => {
            progress = tlprops.progress;
            obj.setZoom(tlprops.zoom);
            obj.transform({
              scale: [tlprops.scaleX, tlprops.scaleY, tlprops.scaleZ],
              position: newPos,
            });
          },
        },
        "-=100"
      );

      open = true;
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

  world.draw({
    projection,
    view,
    time,
    velocity: velocity.value,
    progress: progress,
  });
});
