import * as T from 'three';
import {useLayoutEffect,type RefObject} from 'react';
import {useGame} from './gameStore';
/** Gentle material fill and symmetric lights avoid camera-following bright spots. */
export default function TempleNightFill({root}:{root:RefObject<T.Group>}){const night=useGame(s=>s.night),low=useGame(s=>s.quality==='low');
 useLayoutEffect(()=>{
  const saved=new Map<T.MeshStandardMaterial,{color:T.Color;intensity:number;map:T.Texture|null}>();
  root.current?.traverse(node=>{if(!(node instanceof T.Mesh))return;for(const material of Array.isArray(node.material)?node.material:[node.material]){
   if(!(material instanceof T.MeshStandardMaterial)||saved.has(material))continue;
   saved.set(material,{color:material.emissive.clone(),intensity:material.emissiveIntensity,map:material.emissiveMap});
   if(night&&material.emissive.getHex()===0){material.emissive.copy(material.color).multiply(new T.Color('#e8c28b')).multiplyScalar(.075);material.emissiveMap=material.map;material.emissiveIntensity=1;material.needsUpdate=true;}
  }});
  return()=>saved.forEach((old,m)=>{m.emissive.copy(old.color);m.emissiveIntensity=old.intensity;m.emissiveMap=old.map;m.needsUpdate=true});
 },[night,root]);
 if(!night)return null;
 return <group>{(low?[-6,6].map(x=>[x,6.8,0]):[-7,7].flatMap(x=>[-3.5,4].map(z=>[x,7,z]))).map(([x,y,z],i)=><pointLight key={i} position={[x,y,z]} intensity={low?48:38} distance={22} decay={2} color="#ffe3b3"/>)}{[-3.6,3.6].map(x=><pointLight key={x} position={[x,8.24,10]} intensity={10} distance={12} decay={2} color="#ffdc9a"/>)}</group>;
}
