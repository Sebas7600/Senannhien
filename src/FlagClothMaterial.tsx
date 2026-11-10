import {useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {useGame} from './gameStore';
import {useReducedMotion} from './useReducedMotion';
/** Vertex wind keeps pinned edges stationary, with no CPU cloth simulation. */
export default function FlagClothMaterial({hanging=false}:{hanging?:boolean}){
 const low=useGame(s=>s.quality==='low'),reduced=useReducedMotion();
 const wind=useMemo(()=>({time:{value:0},strength:{value:1}}),[]);
 useFrame(({clock})=>{wind.time.value=clock.elapsedTime;wind.strength.value=reduced?0:low?.75:1;});
 const compile=useMemo(()=>(shader:T.WebGLProgramParametersWithUniforms)=>{
  shader.uniforms.flagTime=wind.time;shader.uniforms.flagStrength=wind.strength;
  shader.vertexShader='attribute vec2 flagWind;uniform float flagTime;uniform float flagStrength;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float freeEdge=flagWind.x;
   float phase=flagWind.y;
   float gust=.72+.28*sin(flagTime*.43+phase*.35);
   float wave=sin(flagTime*1.65-phase+freeEdge*4.4);
   float ripple=sin(flagTime*2.7+phase*1.3-freeEdge*8.);
   transformed.z+=flagStrength*freeEdge*gust*(wave*.15+ripple*.035*freeEdge);
   transformed.x+=flagStrength*freeEdge*${hanging?'sin(flagTime*.85+phase)*.045':'-(1.+wave)*.025'};
   transformed.y+=flagStrength*freeEdge*freeEdge*sin(flagTime*1.15+phase)*.018;
  `);
 },[wind,hanging]);
 return <meshStandardMaterial vertexColors side={T.DoubleSide} roughness={.85} onBeforeCompile={compile} customProgramCacheKey={()=>'pinned-flag-wind-'+hanging}/>;
}
