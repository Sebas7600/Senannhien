import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {useGame} from './gameStore';
import {useReducedMotion} from './useReducedMotion';

// A single transparent surface: no bloom pass, particles or additional lights.
const fragmentShader=`varying vec2 vUv;
uniform float uTime;
uniform float uDetail;
vec3 spectrum(float t){return .55+.45*cos(6.2831853*(t+vec3(0.,.67,.33)));}
void main(){
 vec2 p=(vUv-.5)*5.;float r=length(p),a=atan(p.y,p.x),t=uTime;
 float turn=a-t*.065;
 vec3 rainbow=spectrum(turn/6.2831853+r*.18);
 vec3 gold=vec3(1.,.76,.35);
 float circle=exp(-pow((r-1.15)*26.,2.));
 float inner=exp(-pow((r-1.03)*45.,2.))*.50;
 float rim=exp(-pow((r-1.29)*42.,2.))*.65;
 float haze=exp(-pow((r-1.23)*3.8,2.))*.24;
 // Broad chromatic rays, fine counter-rotating rays, then drifting outer sparks.
 float rays=pow(max(0.,cos(turn*24.+sin(turn*5.)*.55)),7.);
 float fine=pow(max(0.,cos((a+t*.042)*37.-r*2.)),16.)*.65*uDetail;
 float wisps=pow(max(0.,cos((a+t*.025)*13.+r*4.)),9.)*.42;
 float reach=smoothstep(1.06,1.31,r)*exp(-max(0.,r-1.29)*3.0);
 float shimmer=.94+.06*sin(t*.65+a*3.);
 float aura=(rays+fine+wisps)*reach*1.05*shimmer;
 float orbit=exp(-pow((r-(1.57+.045*sin(a*6.-t*.24)))*60.,2.));
 float stars=pow(max(0.,cos(a*29.-t*.23)),40.)*orbit*uDetail;
 float outer=exp(-pow((r-1.42)*50.,2.))*pow(max(0.,cos(a*18.+t*.14)),10.)*.45;
 float core=exp(-r*r*1.8)*.055;
 vec3 c=gold*(circle+inner+rim+haze+core)+mix(rainbow,gold,.14)*(aura+outer)+vec3(1.,.94,.72)*stars*1.4;
 float edge=1.-smoothstep(2.10,2.45,r);
 float alpha=clamp(circle+inner+rim+haze+core+aura+stars+outer,0.,.95)*edge;
 gl_FragColor=vec4(c*edge*1.9,alpha);
}`;
export default function PrismaticHalo({phase=0,position=[0,2.75,-.78],worldAnchor=[0,-31.725]}:{phase?:number;position?:[number,number,number];worldAnchor?:readonly [number,number]}){
 const low=useGame(s=>s.quality==='low'),reduced=useReducedMotion();
 const material=useRef<T.ShaderMaterial>(null);
 const uniforms=useMemo(()=>({uTime:{value:0},uDetail:{value:1}}),[]);
 useFrame(({clock})=>{if(!material.current)return;const s=useGame.getState();if(Math.hypot(s.position[0]-worldAnchor[0],s.position[1]-worldAnchor[1])>42)return;uniforms.uTime.value=(reduced?0:clock.elapsedTime)+phase;uniforms.uDetail.value=low?0:1;});
 return <mesh name="Hao-quang-ngu-sac" position={position}>
  <planeGeometry args={[5,5]}/>
  <shaderMaterial ref={material} uniforms={uniforms} vertexShader={'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'} fragmentShader={fragmentShader} transparent depthWrite={false} blending={T.AdditiveBlending} side={T.DoubleSide} toneMapped={false}/>
 </mesh>;
}
