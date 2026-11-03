import {useMemo} from 'react';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
export type MaterialKind='stone'|'wood'|'plaster'|'roof'|'cloth';
const ids:Record<MaterialKind,string>={stone:'old_sandstone_02',wood:'old_wood_floor',plaster:'grey_plaster',roof:'grey_roof_tiles',cloth:'fabric_pattern_07'};
const cache=new Map<string,THREE.MeshStandardMaterial>();
export function useSurface(kind:MaterialKind,color='#ffffff'){
  const id=ids[kind],maps=useTexture([`/assets/textures/${id}-color.jpg`,`/assets/textures/${id}-normal.jpg`,`/assets/textures/${id}-roughness.jpg`]);
  return useMemo(()=>{const key=kind+color;let material=cache.get(key);if(material)return material;
    maps.forEach((t,i)=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;if(kind==='cloth')t.repeat.set(3,3);else if(kind==='wood')t.repeat.set(1,2);t.needsUpdate=true});
    material=new THREE.MeshStandardMaterial({color,map:kind==='cloth'?null:maps[0],normalMap:maps[1],roughnessMap:maps[2],normalScale:new THREE.Vector2(kind==='cloth'?.025:.35,kind==='cloth'?.025:.35),roughness:kind==='wood'?.8:1,metalness:0,side:THREE.DoubleSide});cache.set(key,material);return material;
  },[kind,color,maps[0],maps[1],maps[2]]);
}
export function classifySurface(color:string):MaterialKind{const c=new THREE.Color(color);if(c.r>c.g*1.15&&c.g>c.b*1.08)return 'wood';if(c.r+c.g+c.b>1.48)return 'plaster';return 'stone';}
