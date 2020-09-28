import { plane } from "./geometry";
import Object3d, { TObject3dProps } from "./Object3d";

export default class Plane extends Object3d {
  constructor(props: TObject3dProps) {
    super(props);

    const [pos, uv] = plane({
      x: this.position[0],
      y: this.position[1],
      z: this.position[2],
      width: this.dimensions[0],
      height: this.dimensions[1],
      subX: 100,
      subY: 100,
    });

    this.setSize(props.scale || [1, 1, 1]);
    this.setPosition(props.position || [0, 0, 0]);
    this.transform({});

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
