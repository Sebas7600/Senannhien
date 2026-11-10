import * as THREE from 'three';

export const morningSunOffset=new THREE.Vector3(-28,24,6);
export const fullMoonOffset=new THREE.Vector3(25,11,-60);
export const morningHorizon='#c6e5f5';
export const nightHorizon='#1b2c4b';

const daySky={
  lightDirection:{value:morningSunOffset.clone().normalize()},
  zenith:{value:new THREE.Color('#438fd7')},
  horizon:{value:new THREE.Color(morningHorizon)},
  discColor:{value:new THREE.Color('#fff7de')},
  night:{value:0},
};
const nightSky={
  lightDirection:{value:fullMoonOffset.clone().normalize()},
  zenith:{value:new THREE.Color('#070e24')},
  horizon:{value:new THREE.Color(nightHorizon)},
  discColor:{value:new THREE.Color('#eaf1ff')},
  night:{value:1},
};

export default function CourtyardSky({night}:{night:boolean}){
  return <mesh frustumCulled={false} renderOrder={-100}>
    <sphereGeometry args={[1,24,12]}/>
    <shaderMaterial uniforms={night?nightSky:daySky} side={THREE.BackSide} depthTest={false} depthWrite={false} toneMapped={false}
      vertexShader={`
        varying vec3 skyDirection;
        void main(){
          skyDirection=position;
          vec4 clip=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);
          gl_Position=clip.xyww;
        }`}
      fragmentShader={`
        varying vec3 skyDirection;
        uniform vec3 lightDirection,zenith,horizon,discColor;
        uniform float night;
        float hashMoon(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float moonNoise(vec2 p){
          vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
          return mix(mix(hashMoon(i),hashMoon(i+vec2(1,0)),f.x),
            mix(hashMoon(i+vec2(0,1)),hashMoon(i+vec2(1,1)),f.x),f.y);
        }
        float cloudCover(vec3 direction){
          float h=max(direction.y,0.0);
          vec2 p=direction.xz*(2.4/(h+.29))*vec2(1.0,1.32)+vec2(8.7,3.1);
          float shape=moonNoise(p)*.62+moonNoise(p*2.25+vec2(6.1,-3.7))*.27
            +moonNoise(p*5.1+vec2(-1.8,4.4))*.11;
          return smoothstep(.44,.67,shape)*smoothstep(.025,.15,h);
        }
        void main(){
          vec3 direction=normalize(skyDirection);
          float height=clamp(direction.y,0.0,1.0);
          vec3 sky=mix(horizon,zenith,smoothstep(0.0,0.64,pow(height,0.66)));
          float towardLight=dot(direction,lightDirection);
          if(night>.5){
            vec3 right=normalize(cross(vec3(0,1,0),lightDirection));
            vec3 up=cross(lightDirection,right);
            vec2 p=vec2(dot(direction,right),dot(direction,up))/.024;
            float r=length(p);
            float moonMask=(1.0-smoothstep(.965,1.015,r))*step(0.0,towardLight);
            float relief=moonNoise(p*4.5)*.58+moonNoise(p*12.0)*.29+moonNoise(p*34.0)*.13;
            float maria=smoothstep(.31,.59,relief);
            float limb=mix(.85,1.0,sqrt(max(0.0,1.0-r*r)));
            vec3 moon=discColor*mix(.52,1.0,maria)*limb;
            float halo=exp(-r*r*.064)*.073*step(0.0,towardLight);
            sky=mix(sky,vec3(.22,.37,.68),halo);
            sky=mix(sky,moon,moonMask);
          }else{
            float glow=smoothstep(0.991,0.9998,towardLight)*0.24;
            float disc=smoothstep(0.99962,0.99979,towardLight);
            sky=mix(sky,discColor,max(glow,disc));
          }
          float cloud=cloudCover(direction);
          float rim=pow(max(towardLight,0.0),7.0);
          vec3 daylightCloud=mix(vec3(.67,.78,.87),vec3(1.0,.93,.8),rim*.42);
          vec3 moonlitCloud=mix(vec3(.047,.07,.115),vec3(.16,.22,.36),rim*.72);
          sky=mix(sky,mix(daylightCloud,moonlitCloud,night),cloud*mix(.84,.61,night));
          gl_FragColor=vec4(sky,1.0);
          #include <colorspace_fragment>
        }
        `}/>
  </mesh>;
}
