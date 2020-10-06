import { TObject3dProps } from "./Object3d";
import Group from "./Group";
import { Vec2 } from "./types";

export default class Scene extends Group {
  private mouse: Vec2 = { x: 0, y: 0 };
  private mousedown: Vec2 = { x: 0, y: 0 };

  constructor(props?: TObject3dProps) {
    super(props);

    window.addEventListener("mousedown", (e) => {
      this.dispatch("mousedown", e);
      this.mouse = { x: e.clientX, y: e.clientY };
      this.mousedown = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mousemove", (e) => {
      this.dispatch("mousemove", e);
      this.mouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mouseup", (e) => {
      this.dispatch("mouseup", e);
      this.mouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("click", () => {
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
    });
  }

  on(event: string, cb: (obj: any) => void) {
    this.events[event] = cb;
    for (let child of this.children) {
      child.on(event, cb);
    }
  }
}
