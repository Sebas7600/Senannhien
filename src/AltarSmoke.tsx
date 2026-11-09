import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {useReducedMotion} from './useReducedMotion';

// Two interleaved wisps in one draw call, with no textures or per-particle CPU work.
const geometry=new T.BufferGeometry();
geometry.setAttribute('position',new T.Float32BufferAttribute(Array.from({length:40},(_,i)=>[i%2,i/40,0]).flat(),3));
export default function AltarSmoke({position,lit}:{position:[number,number,number];lit:boolean}){
 const ref=useRef<T.Points>(null),point=useRef(new T.Vector3()),reduced=useReducedMotion();
 const material=useMemo(()=>new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},ratio:{value:1}},
 vertexShader:`uniform float time;uniform float ratio;varying float fade;void main(){
   float t=fract(time*.12+position.y);float strand=position.x;
   vec3 p=vec3((sin(t*8.-time*.3+strand*.7)*.11+sin(t*15.+strand)*.035)*(.2+t),t*1.3,cos(t*5.+strand)*.025);
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
   gl_PointSize=clamp((.065+t*.14)*ratio*450./max(-mv.z,.1),1.,60.);
   fade=smoothstep(0.,.07,t)*pow(1.-t,1.3)*.38;
 }`,fragmentShader:`varying float fade;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*19.)*fade;gl_FragColor=vec4(.83,.85,.80,a);}`}),[]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame(({camera,clock,gl})=>{if(!ref.current)return;const visible=lit&&camera.position.distanceTo(ref.current.getWorldPosition(point.current))<35;ref.current.visible=visible;if(visible){material.uniforms.time.value=reduced?0:clock.elapsedTime;material.uniforms.ratio.value=Math.min(gl.getPixelRatio(),1.5);}});
 return <points ref={ref} position={position} visible={lit} geometry={geometry} material={material} frustumCulled={false}/>;
}
