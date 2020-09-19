import Object3d, { TViewProps } from "./Object3d";
import { Vec3 } from "./types";

export default class Group extends Object3d {
  protected children: Array<Object3d> = [];

  getChildren() {
    return this.children;
  }

  add(obj: Object3d) {
    this.children.push(obj);
  }

  on(event: string, cb: (obj: Object3d) => void) {
    for (let child of this.children) {
      child.on(event, cb);
    }
  }

  update(props: TViewProps, cursor: Vec3) {
    for (let child of this.children) {
      child.update(props, cursor);
    }
  }

  draw(props: any) {
    for (let child of this.children) {
      child.draw(props);
    }
  }
}
