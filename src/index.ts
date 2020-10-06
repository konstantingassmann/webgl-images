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

const camera = new Camera(gl, { x: 0, y: 0, z: -50 });

const regl = reglLib(gl);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.FRONT);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.BLEND);
gl.disable(gl.DEPTH_TEST);

const world = new Scene();

let state: Array<{ id: string; open: boolean; position?: Vec3 }> = [];

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
    size: { x: gl.canvas.width, y: gl.canvas.height, z: 1 },
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

    const currentPosition: Vec3 = { ...obj.getPosition() };

    const objSize = obj.getSize();

    const childs = world.getChildren().filter((child) => child.id !== obj.id);

    const tlprops = {
      zoom: obj.getZoom(),
      opacity: 1,
      scaleX: objSize.x,
      scaleY: objSize.y,
      scaleZ: objSize.z,
      progress: 0,
      x: currentPosition.x,
      y: currentPosition.y,
    };

    const tl = anime.timeline();

    if (open) {
      const newPosition = state[idx].position || { x: 0, y: 0, z: 0 };
      tlprops.opacity = 0;
      tl.add({
        targets: tlprops,
        zoom: 1.2,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        easing: "easeOutQuad",
        duration: 300,
        x: newPosition.x || 0,
        y: newPosition.y || 0,
        update: () => {
          obj.setZoom(tlprops.zoom);
          obj.transform({
            scale: { x: tlprops.scaleX, y: tlprops.scaleY, z: tlprops.scaleZ },
            position: { x: tlprops.x, y: tlprops.y, z: 0 },
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

      const projectedZero = camera.unproject({
        position: { x: 0, y: 0, z: 0 },
      }).position;

      tl.add({
        targets: tlprops,
        opacity: 0,
        easing: "easeOutQuad",
        duration: 300,
        update: () => {
          childs.forEach((child) => child.setOpacity(tlprops.opacity));
        },
      })
        .add(
          {
            targets: tlprops,
            zoom: 1,
            scaleX: size.y / dims.y,
            scaleY: size.y / dims.y,
            scaleZ: 1,
            easing: "easeOutQuad",
            duration: 300,
            x: projectedZero.x + cameraPosition.x,
            y: projectedZero.y + cameraPosition.y,
            update: () => {
              obj.setZoom(tlprops.zoom);
              obj.transform({
                scale: {
                  x: tlprops.scaleX,
                  y: tlprops.scaleY,
                  z: tlprops.scaleZ,
                },
                position: { x: tlprops.x, y: tlprops.y, z: 0 },
              });
            },
          },
          "-=100"
        )
        .add(
          {
            targets: tlprops,
            duration: 3000,
            progress: 1,
            easing: "linear",
            update: () => {
              progress = tlprops.progress;
            },
          },
          "-=1400"
        );

      open = true;
    }
    state[idx].open = open;
    state[idx].position = currentPosition;
  });
});

let dragging = false;
let mouse: Vec2 = { x: 0, y: 0 };
let cursor: Vec3 = { x: 0, y: 0, z: 0 };
let dragOffset: Vec3 = { x: 0, y: 0, z: -50 };
let cameraPosition: Vec3 = { x: 0, y: 0, z: -50 };
let lastMouse: Vec2 = { x: 0, y: 0 };
const velocity = smoothValue<Array<number>>([0, 0], 0.1);

world.on("mousedown", (e) => {
  dragging = true;
  mouse = toClipspace(
    { x: e.clientX, y: e.clientY },
    { x: window.innerWidth, y: window.innerHeight }
  );
  lastMouse = mouse;
});

world.on("mousemove", (e) => {
  const projectedMouse = camera.unproject({
    position: { x: e.clientX * dpr, y: e.clientY * dpr, z: 0 },
  }).position;

  cursor = {
    x: projectedMouse.x + cameraPosition.x,
    y: projectedMouse.y + cameraPosition.y,
    z: projectedMouse.z,
  };

  if (dragging) {
    const m = toClipspace(
      { x: e.clientX, y: e.clientY },
      { x: window.innerWidth, y: window.innerHeight }
    );

    dragOffset = {
      x: dragOffset.x - (m.x - mouse.x) * 20,
      y: dragOffset.y - (m.y - mouse.y) * 20,
      z: -50,
    };

    lastMouse = mouse;
    mouse = m;
  }
});

world.on("mouseup", () => {
  dragging = false;
});

regl.frame(({ time }: { time: number }) => {
  cameraPosition = lerp3(cameraPosition, dragOffset, 0.1);
  velocity.value = [lastMouse.x - mouse.x, lastMouse.y - mouse.y];
  velocity.update();

  camera.setPosition(cameraPosition);
  camera.lookAt({ x: cameraPosition.x, y: cameraPosition.y, z: 0 });

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
