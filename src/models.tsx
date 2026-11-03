import ScannedBuddha from './ScannedBuddha';
import {canopyGeometry,foliageMaterial} from './foliage';
import {useSurface,classifySurface} from './materials';
import { useMemo,useRef } from 'react';
import {useCameraOccluder} from './cameraObstruction';

import { Line } from '@react-three/drei';
import * as THREE from 'three';

export function Box({ position = [0,0,0], scale = [1,1,1], color = '#74503b', rotation = [0,0,0] }: {position?: [number,number,number]; scale?: [number,number,number]; color?: string; rotation?: [number,number,number]}) {
  const material=useSurface(classifySurface(color),color);return <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow material={material}><boxGeometry/></mesh>;
}
export function Roof({ y, width, depth, height }: {y:number;width:number;depth:number;height:number}) {
  const material=useSurface('roof','#8a9b89'); const geometry = useMemo(() => {
    const vertices: number[] = [], indices: number[] = []; const segments = 12;
    for(let i=0;i<=segments;i++) { const t=i/segments; const w=width*(1-t*.78); const d=depth*(1-t*.65); const yy=y+height*t*t;
      vertices.push(-w/2,yy,-d/2,w/2,yy,-d/2,w/2,yy,d/2,-w/2,yy,d/2);
    }
    for(let i=0;i<segments;i++) for(let s=0;s<4;s++) { const a=i*4+s,b=i*4+(s+1)%4,c=a+4,d=b+4; indices.push(a,b,c,b,d,c); }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap((_,i)=>i%3===0?[vertices[i]/1.5,vertices[i+2]/1.5]:[]),2));g.computeVertexNormals();return g;
  },[y,width,depth,height]);
  return <group><mesh geometry={geometry} castShadow receiveShadow material={material}/>
    {[-1,1].map(s=><group key={s}>
      <Line points={Array.from({length:17},(_,i)=>{const t=i/16;return [s*width/2*(1-t*.78),y+height*t*t+.025,depth/2*(1-t*.65)] as [number,number,number];})} color="#c6a96c" lineWidth={2}/>
      <Line points={[[-width/2,y,s*depth/2],[0,y-.12,s*depth/2],[width/2,y,s*depth/2]]} color="#bba572" lineWidth={2}/>
      {[-1,1].map(k=><Line key={k} points={[[s*width/2*.8,y+.02,k*depth/2*.92],[s*width/2,y+.13,k*depth/2],[s*(width/2+.38),y+.65,k*(depth/2+.2)]]} color="#a68a50" lineWidth={3}/>)}
    </group>)}
    <Box position={[0,y+height+.05,0]} scale={[width*.25,.14,depth*.36]} color="#b49b60"/>
  </group>;
}
export function Buddha(){return <ScannedBuddha/>}
export function Lantern({position}:{position:[number,number,number]}) { const night=false; return <group position={position}><mesh><sphereGeometry args={[.25,12,12]}/><meshStandardMaterial color="#f2cf86" emissive="#f7b245" emissiveIntensity={night?1.2:.65}/></mesh><Box position={[0,.28,0]} scale={[.18,.08,.18]} color="#645133"/><Box position={[0,-.3,0]} scale={[.04,.18,.04]} color="#b78949"/></group>; }
export function Tree({position,scale=1,banyan=false}:{position:[number,number,number];scale?:number;banyan?:boolean}) {
  const bark=useSurface('wood','#8a8a76'),crown=useRef<THREE.Mesh>(null);useCameraOccluder(crown);
  return <group position={position} scale={scale}>
    <mesh position={[0,1.45,0]} castShadow material={bark}><cylinderGeometry args={[banyan?.32:.18,.42,2.9,14]}/></mesh>
    {[[-.8,2.2,0,.6],[.65,2.5,.2,-.5],[-.3,2.8,-.5,.35]].map(([x,y,z,r],i)=><mesh key={i} position={[x,y,z]} rotation={[0,0,r]} castShadow material={bark}><cylinderGeometry args={[.055,.19,1.8,10]}/></mesh>)}
    <mesh ref={crown} geometry={canopyGeometry} material={foliageMaterial} castShadow receiveShadow/>
    {banyan&&Array.from({length:8},(_,i)=><mesh key={i} position={[Math.sin(i*2.4)*1.3,1.6,Math.cos(i*2.4)*1.1]}><cylinderGeometry args={[.025,.035,2.6,4]}/><meshStandardMaterial color="#87765a"/></mesh>)}
    {banyan&&<mesh position={[0,.13,0]}><cylinderGeometry args={[1.7,1.8,.25,32]}/><meshStandardMaterial color="#a3a589"/></mesh>}
  </group>;
}
