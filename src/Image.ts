import Plane from "./Plane";
import { TViewProps, TObject3dProps } from "./Object3d";
import { Vec2 } from "./types";
import { mat4, vec3 } from "gl-matrix";

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
  private textureMatrix: mat4;

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
        uniform mat4 textureMatrix;

        varying vec2 vUv;
    
        void main () {
          vec3 pos = position;
          
          // float start = 0.;
          
          // float startAt = (uv.x - uv.y + 1.) / 2. * start;
          
          // float startAt = start;
          // float vprog = smoothstep(startAt, 1., progress);
          
          //pos.y = pos.y + sin(vprog * 20.);
          
          //float wave = sin((1. - pos.x + time * 2.) * 0.5);
          
          gl_Position = projection * view * modelViewMatrix * vec4(pos, 1);
          
          vUv = (textureMatrix * vec4(uv.xy, 0, 1)).xy;
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
      
      varying vec2 vUv;

      void main () {
        vec2 aspectUv = vec2(vUv.x + velocity.x * 2., vUv.y * aspect + velocity.y * 2.);

        if (aspectUv.x < 0.0 ||
          aspectUv.y < 0.0 ||
          aspectUv.x > 1.0 ||
          aspectUv.y > 1.0) {
            //discard;
        }

        vec4 img = texture2D(image, aspectUv);
        gl_FragColor = vec4(img.rgb, opacity);
        // gl_FragColor = vec4(0., 0., 1., 1.);
      }
    `,
      uniforms: {
        image: props.regl.prop("image"),
        aspect: props.regl.prop("aspect"),
        time: props.regl.prop("time"),
        zoom: props.regl.prop("zoom"),
        velocity: props.regl.prop("velocity"),
        opacity: props.regl.prop("opacity"),
        progress: props.regl.prop("progress"),
        textureMatrix: props.regl.prop("textureMatrix"),
      },
    };

    super(planeProps);

    this.img = props.regl.texture(props.src);

    this.aspect = 1;
    this.zoom = 1;
    this.resolution = [props.src.width, props.src.height];
    this.textureMatrix = mat4.create();
    this.updateFunctions.push(() => this.calcTextureMatrix());
    this.calcModelViewMatrix();
  }

  setZoom(z: number) {
    this.zoom = z;
  }

  getZoom() {
    return this.zoom;
  }

  calcTextureMatrix() {
    this.textureMatrix = mat4.create();

    this.textureMatrix = mat4.translate(
      this.textureMatrix,
      this.textureMatrix,
      vec3.clone([0.5, 0.5, 1])
    );

    this.textureMatrix = mat4.scale(
      this.textureMatrix,
      this.textureMatrix,
      vec3.clone([1 / this.zoom, 1 / this.zoom, 1 / 1])
    );

    this.textureMatrix = mat4.translate(
      this.textureMatrix,
      this.textureMatrix,
      vec3.clone([-0.5, -0.5, 1])
    );
  }

  draw(props: TViewProps & TImageDrawProps) {
    this.drawFunc({
      ...props,
      modelViewMatrix: this.modelViewMatrix,
      textureMatrix: this.textureMatrix,
      image: this.img,
      aspect: this.aspect,
      zoom: this.zoom,
      velocity: props.velocity,
      opacity: this.opacity,
      progress: props.progress,
    });
  }
}
