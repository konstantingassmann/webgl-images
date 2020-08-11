import Plane from "./Plane";
import { TViewProps, TObject3dProps } from "./Object3d";
import { Vec2 } from "./types";
import { smoothValue, TSmoothValue } from "./utils";

type TImg = {
  src: HTMLImageElement;
};

type TImageDrawProps = {
  velocity: Vec2;
};

export default class Img extends Plane {
  private img: any;
  private aspect: number;

  private zoom: TSmoothValue<number>;
  private zoomTarget: number;
  private resolution: Vec2;

  constructor(props: TObject3dProps & TImg) {
    const planeProps = {
      ...props,
      frag: `
      precision mediump float;

      uniform sampler2D image;
      uniform float aspect;
      uniform float time;
      uniform float zoom;
      uniform vec2 velocity;
      uniform vec2 resolution;
      
      varying vec2 vUv;

      mat2 scale(vec2 _scale){
        return mat2(2. - _scale.x, 0.0, 0.0, 2. - _scale.y);
      }

      void main () {
        vec2 aspectUv = vec2(vUv.x + velocity.x, vUv.y * aspect + velocity.y);
        aspectUv -= vec2(0.5);
        aspectUv = aspectUv * scale(vec2(zoom));
        aspectUv += vec2(0.5);
        vec4 img = texture2D(image, aspectUv);
        gl_FragColor = img;
      }
    `,
      uniforms: {
        image: props.regl.prop("image"),
        aspect: props.regl.prop("aspect"),
        time: props.regl.prop("time"),
        zoom: props.regl.prop("zoom"),
        velocity: props.regl.prop("velocity"),
        resolution: props.regl.prop("resolution")
      }
    };

    super(planeProps);

    this.img = props.regl.texture(props.src);

    this.aspect = 1;
    this.zoom = smoothValue(1, 0.1);
    this.zoomTarget = 1;
    this.resolution = [props.src.width, props.src.height];

    this.updateFunctions.push(() => {
      this.zoom.value = this.zoomTarget;
    });
  }

  setZoom(z: number) {
    this.zoomTarget = z;
  }

  getZoom() {
    return this.zoomTarget;
  }

  draw(props: TViewProps & TImageDrawProps) {
    this.drawFunc({
      ...props,
      modelViewMatrix: this.modelViewMatrix,
      image: this.img,
      aspect: this.aspect,
      zoom: this.zoom.value,
      velocity: props.velocity,
      resolution: this.resolution
    });
  }
}
