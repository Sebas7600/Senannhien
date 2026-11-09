import {useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {GATE} from './courtyardPropsData';

// Cached high/low models share material/texture objects; the reflection card
// reuses this same asset path without importing outdoor physics or NPC logic.
const materials=new Map<string,THREE.Material>();
export function useCourtyardProp(kind:'gate'|'bell'|'drum'){
  const low=useGame(s=>s.quality==='low');
  const file=kind==='gate'?(low?GATE.lowFile:GATE.highFile):`${kind}${low?'-low':''}.glb`;
  const {scene}=useGLTF(`/assets/courtyard/${file}`,false,true);
  return useMemo(()=>{
    const model=scene.clone(true);
    model.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      const m=o.material as THREE.MeshStandardMaterial,key=kind+':'+m.name;
      let shared=materials.get(key);
      if(!shared){m.envMapIntensity=.9;for(const texture of [m.map,m.normalMap])if(texture)texture.anisotropy=4;materials.set(key,m);shared=m;}
      o.material=shared;o.castShadow=!low;o.receiveShadow=true;
    });
    return model;
  },[scene,kind,low]);
}
