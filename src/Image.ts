import Plane from "./Plane";
import { TViewProps, TObject3dProps } from "./Object3d";
import { Vec2 } from "./types";

type TImg = {
  src: HTMLImageElement;
};

type TImageDrawProps = {
  velocity: Vec2;
  progress: number;
};

export default class Img extends Plane {
  private img: any;
  private aspect: number;

  private zoom: number;
  private resolution: Array<number>;

  constructor(props: TObject3dProps & TImg) {
    const planeProps = {
      ...props,
      vert: `
        precision mediump float;
        attribute vec3 position;
        attribute vec3 uv;
    
        uniform mat4 projection;
        uniform mat4 view;
        uniform float time;
        uniform float progress;
        uniform mat4 modelViewMatrix;

        varying vec2 vUv;
    
        void main () {
          vec3 pos = position;
          float start = 0.5;
          float startAt = (uv.x-uv.y+1.)/2. * start;
          float vprog = smoothstep(startAt, 1., progress);
          pos.y = pos.y + sin(vprog * 20.);
          gl_Position = projection * view * modelViewMatrix * vec4(pos, 1);
          vUv = vec2(uv.x, uv.y);
        }
      `,
      frag: `
      precision mediump float;

      uniform sampler2D image;
      uniform float aspect;
      uniform float time;
      uniform float zoom;
      uniform float opacity;
      uniform vec2 velocity;
      uniform vec2 resolution;
      
      varying vec2 vUv;

      mat2 scale(vec2 _scale){
        return mat2(2. - _scale.x, 0.0, 0.0, 2. - _scale.y);
      }

      void main () {
        vec2 aspectUv = vec2(vUv.x + velocity.x * 2., vUv.y * aspect + velocity.y * 2.);
        aspectUv -= vec2(0.5);
        aspectUv = aspectUv * scale(vec2(zoom));
        aspectUv += vec2(0.5);
        vec4 img = texture2D(image, aspectUv);
        gl_FragColor = vec4(img.rgb, opacity);
      }
    `,
      uniforms: {
        image: props.regl.prop("image"),
        aspect: props.regl.prop("aspect"),
        time: props.regl.prop("time"),
        zoom: props.regl.prop("zoom"),
        velocity: props.regl.prop("velocity"),
        resolution: props.regl.prop("resolution"),
        opacity: props.regl.prop("opacity"),
        progress: props.regl.prop("progress"),
      },
    };

    super(planeProps);

    this.img = props.regl.texture(props.src);

    this.aspect = 1;
    this.zoom = 1;
    this.resolution = [props.src.width, props.src.height];
  }

  setZoom(z: number) {
    this.zoom = z;
  }

  getZoom() {
    return this.zoom;
  }

  draw(props: TViewProps & TImageDrawProps) {
    this.drawFunc({
      ...props,
      modelViewMatrix: this.modelViewMatrix,
      image: this.img,
      aspect: this.aspect,
      zoom: this.zoom,
      velocity: props.velocity,
      resolution: this.resolution,
      opacity: this.opacity,
      progress: props.progress,
    });
  }
}
