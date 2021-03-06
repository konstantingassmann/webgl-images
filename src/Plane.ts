import { plane } from "./geometry";
import Object3d, { TObject3dProps } from "./Object3d";

export default class Plane extends Object3d {
  constructor(props: TObject3dProps) {
    super(props);

    const [pos, uv] = plane({
      width: this.dimensions.x,
      height: this.dimensions.y,
      subX: 3,
      subY: 4,
    });

    this.setSize(props.scale || { x: 1, y: 1, z: 1 });
    this.setPosition(props.position || { x: 0, y: 0, z: 0 });

    this.drawFunc = props.regl({
      vert:
        props.vert ||
        `
        precision mediump float;
        attribute vec3 position;
        attribute vec3 uv;
    
        uniform mat4 projection;
        uniform mat4 view;
        uniform mat4 modelViewMatrix;

        varying vec2 vUv;
    
        void main () {
          gl_Position = projection * view * modelViewMatrix * vec4(position, 1);
          vUv = vec2(uv.x, uv.y);
        }
    `,
      frag:
        props.frag ||
        `
      void main () {
        gl_FragColor = vec4(1, 1, 1, 1);
      }
    `,
      attributes: {
        position: props.regl.buffer(pos),
        uv: props.regl.buffer(uv),
      },
      uniforms: {
        projection: props.regl.prop("projection"),
        view: props.regl.prop("view"),
        modelViewMatrix: props.regl.prop("modelViewMatrix"),
        ...(props.uniforms || {}),
      },
      count: pos.length / 3,
    });
  }
}
