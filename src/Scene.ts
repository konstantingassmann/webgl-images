import { TObject3dProps } from "./Object3d";
import Group from "./Group";
import { Vec2 } from "./types";

export default class Scene extends Group {
  private mouse: Vec2 = [0, 0];
  private mousedown: Vec2 = [0, 0];

  constructor(props?: TObject3dProps) {
    super(props);

    window.addEventListener("mousedown", (e) => {
      this.dispatch("mousedown", e);
      this.mouse = [e.clientX, e.clientY];
      this.mousedown = [e.clientX, e.clientY];
    });

    window.addEventListener("mousemove", (e) => {
      this.dispatch("mousemove", e);
      this.mouse = [e.clientX, e.clientY];
    });

    window.addEventListener("mouseup", (e) => {
      this.dispatch("mouseup", e);
      this.mouse = [e.clientX, e.clientY];
    });

    window.addEventListener("click", () => {
      if (
        this.mousedown[0] !== this.mouse[0] ||
        this.mousedown[1] !== this.mouse[1]
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
