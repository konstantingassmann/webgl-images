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
      vert: `
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

        const float PI = 6.28318530718;
        const float Directions = 16.0; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
    const float Quality = 4.0; // BLUR QUALITY (Default 4.0 - More is better but slower)
    const float Size = 8.0;
    vec2 Radius = Size/resolution.xy;

    const float COMP = 6.28318530718 / 16.0;
    
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = gl_FragCoord.xy/resolution.xy;
    // Pixel colour
    vec4 Color = texture2D(image, aspectUv);

    for( float d=0.0; d<PI; d+=COMP)
    {
		for(float i=1.0/Quality; i<=1.0; i+=1.0/Quality)
        {
			Color += texture2D( image, aspectUv + vec2(cos(d),sin(d))*Radius*i);		
        }
    }
    
    // Output to screen
    Color /= Quality * Directions - 15.0;

    float left = step(0., aspectUv.x);   // Similar to ( X greater than 0.1 )
    float bottom = step(0.2, aspectUv.y); // Similar to ( Y greater than 0.1 )

    // The multiplication of left*bottom will be similar to the logical AND.
    vec4 color = vec4(1. - vec3( left * bottom ), 1.);

        gl_FragColor = Color * color + img * (1. - color);
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
