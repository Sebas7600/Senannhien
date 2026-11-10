import * as T from 'three';
import {useLayoutEffect} from 'react';
import {useGame} from './gameStore';
import {batchGeometry,coloredGeometry} from './geometryBatch';
import {roofTiers,roofNightUniform} from './TempleRoofDetail';
const frames:T.BufferGeometry[]=[],bulbs:T.BufferGeometry[]=[],halos:T.BufferGeometry[]=[];
const box=new T.BoxGeometry(1,1,1),halo=new T.PlaneGeometry(.9,.48);
for(const tier of roofTiers)for(const side of [-1,1])for(const front of [false,true]){
 const extent=front?tier.halfX:tier.halfZ,edge=front?tier.halfZ:tier.halfX,count=front?9:5;
 for(let i=0;i<count;i++){
  const along=extent*(i/(count-1)*1.64-.82),y=tier.y+.075+tier.lift*Math.pow(Math.max(0,(Math.abs(along)/extent-.32)/.68),3.1);
  const x=front?along:side*(edge+.10),z=front?side*(edge+.10):along,yaw=front?(side===1?0:Math.PI):(side===1?Math.PI/2:-Math.PI/2);
  frames.push(coloredGeometry(box,'#624b34',[x,y+.12,z],[.26,.14,.18],[0,yaw,0]));
  bulbs.push(coloredGeometry(box,'#fff1bd',[x+Math.sin(yaw)*.10,y+.15,z+Math.cos(yaw)*.10],[.19,.045,.035],[0,yaw,0]));
  const glow=coloredGeometry(halo,'#ffffff',[x+Math.sin(yaw)*.135,y+.15,z+Math.cos(yaw)*.135],[1,1,1],[0,yaw,0]);
  glow.setAttribute('uv',new T.Float32BufferAttribute([0,1,0,0,1,1,0,0,1,0,1,1],2));halos.push(glow);
 }
}
box.dispose();halo.dispose();const housings=batchGeometry(frames),glass=batchGeometry(bulbs),glows=batchGeometry(halos);
export default function TempleRoofLights(){const night=useGame(s=>s.night);useLayoutEffect(()=>{roofNightUniform.value=night?1:0},[night]);return <group>
 <mesh geometry={housings}><meshStandardMaterial vertexColors roughness={.8}/></mesh>
 {night&&<><mesh geometry={glass}><meshBasicMaterial vertexColors toneMapped={false}/></mesh>
 <mesh geometry={glows} renderOrder={2}><shaderMaterial transparent depthWrite={false} blending={T.AdditiveBlending} vertexShader={'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'} fragmentShader={'varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float a=exp(-r*r*4.)*(1.-smoothstep(.5,1.,r));gl_FragColor=vec4(1.,.64,.25,a*.2);}'}/></mesh></>}
 </group>}
