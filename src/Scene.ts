import { TObject3dProps } from "./Object3d";
import Group from "./Group";
import { Vec2 } from "./types";

export default class Scene extends Group {
  private mouse: Vec2 = { x: 0, y: 0 };
  private mousedown: Vec2 = { x: 0, y: 0 };

  constructor(props?: TObject3dProps) {
    super(props);

    const down = (x: number, y: number) => {
      this.dispatch("mousedown", { x: x, y: y });
      this.mouse = { x: x, y: y };
      this.mousedown = { x: x, y: y };
    };

    const move = (x: number, y: number) => {
      this.dispatch("mousemove", { x: x, y: y });
      this.mouse = { x: x, y: y };
    };

    const up = (x: number, y: number) => {
      this.dispatch("mouseup", { x: x, y: y });
      this.mouse = { x: x, y: y };
    };

    const click = () => {
      if (
        this.mousedown.x !== this.mouse.x ||
        this.mousedown.y !== this.mouse.y
      ) {
        return;
      }

      this.children.forEach((child) => {
        if (child.mouseover) {
          child.dispatch("click", child);
        }
      });
    };

    window.addEventListener("mousedown", (e) => {
      down(e.clientX, e.clientY);
    });

    window.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      down(touch.clientX, touch.clientY);
    });

    window.addEventListener("mousemove", (e) => {
      move(e.clientX, e.clientY);
    });

    window.addEventListener("touchmove", (e) => {
      const touch = e.touches[0];
      move(touch.clientX, touch.clientY);
    });

    window.addEventListener("mouseup", (e) => {
      this.dispatch("mouseup", e);
      up(e.clientX, e.clientY);
    });

    window.addEventListener("touchend", (e) => {
      up(this.mousedown.x, this.mousedown.y);
    });

    window.addEventListener("click", () => {
      click();
    });
  }

  on(event: string, cb: (obj: any) => void) {
    this.events[event] = cb;
    for (let child of this.children) {
      child.on(event, cb);
    }
  }
}
