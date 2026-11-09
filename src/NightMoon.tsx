import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
function moonMap(){
  const w=128,h=64,bytes=new Uint8Array(w*h*4),craters=[[.22,.51,.09],[.52,.62,.07],[.62,.38,.13],[.82,.56,.06],[.42,.22,.05]];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let shade=.92+.025*Math.sin(x*2.7+y*3.1);
    for(const [cx,cy,r] of craters){const d=Math.hypot((x/w-cx)*2,y/h-cy)/r;if(d<1)shade-=.16*(1-d*d);}
    const i=(y*w+x)*4;bytes[i]=255*shade;bytes[i+1]=250*shade;bytes[i+2]=222*shade;bytes[i+3]=255;
  }
  const map=new THREE.DataTexture(bytes,w,h);map.colorSpace=THREE.SRGBColorSpace;map.needsUpdate=true;return map;
}
function haloMap(){const w=32,bytes=new Uint8Array(w*w*4);for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,r=Math.hypot((x+.5)/w-.5,(y+.5)/w-.5)*2;bytes[i]=bytes[i+1]=bytes[i+2]=255;bytes[i+3]=255*Math.max(0,1-r)**2;}const t=new THREE.DataTexture(bytes,w,w);t.needsUpdate=true;return t;}
export default function NightMoon(){
  const root=useRef<THREE.Group>(null),maps=useMemo(()=>({moon:moonMap(),halo:haloMap()}),[]);
  useEffect(()=>()=>{maps.moon.dispose();maps.halo.dispose();},[maps]);
  useFrame(({camera})=>{if(root.current)root.current.position.copy(camera.position).add(offset);});
  return <group ref={root} renderOrder={90}><mesh><sphereGeometry args={[3.1,28,20]}/><meshBasicMaterial map={maps.moon} fog={false} toneMapped={false} depthWrite={false}/></mesh><sprite scale={[14,14,1]}><spriteMaterial map={maps.halo} color="#e1e8ff" transparent opacity={.2} blending={THREE.AdditiveBlending} depthWrite={false} fog={false}/></sprite></group>;
}
const offset=new THREE.Vector3(8,28,-110);
