import {useEffect,useLayoutEffect,useMemo} from 'react';
import {useGLTF,useTexture} from '@react-three/drei';
import * as T from 'three';
import {useGame} from './gameStore';

const root='/assets/water-task/';
const prefixes=['well-stone','well-arch','jar-glaze'];
const paths=prefixes.flatMap(prefix=>['color','roughness','normal'].map(kind=>`${root}${prefix}-v1-${kind}.webp`));

export function useWaterStationAssets(){
  const low=useGame(s=>s.quality==='low');
  const {scene}=useGLTF(`${root}water-stations-v1${low?'-low':''}.glb`,false,true);
  const maps=useTexture(paths);
  const materials=useMemo(()=>prefixes.map((name,i)=>{
    const strength=i===0?.46:i===1?.72:.32;
    const parameters={name,map:maps[i*3],roughnessMap:maps[i*3+1],normalMap:maps[i*3+2],
      normalScale:new T.Vector2(strength,strength),roughness:1,metalness:0,envMapIntensity:i===2?.75:.45};
    return i===2?new T.MeshPhysicalMaterial({...parameters,clearcoat:.32,clearcoatRoughness:.3}):new T.MeshStandardMaterial(parameters);
  }),[maps[0],maps[1],maps[2],maps[3],maps[4],maps[5],maps[6],maps[7],maps[8]]);
  useEffect(()=>()=>materials.forEach(material=>material.dispose()),[materials]);
  useLayoutEffect(()=>{
    maps.forEach((texture,i)=>{
      texture.colorSpace=i%3===0?T.SRGBColorSpace:T.NoColorSpace;
      texture.flipY=false;
      texture.anisotropy=low?1:4;texture.needsUpdate=true;
    });
    const glaze=materials[2] as T.MeshPhysicalMaterial;
    glaze.clearcoat=low?0:.32;glaze.needsUpdate=true;
  },[low,materials,...maps]);
  return useMemo(()=>({
    stone:(scene.getObjectByName('Well_Stone') as T.Mesh).geometry,
    arch:(scene.getObjectByName('Well_Arch') as T.Mesh).geometry,
    jar:(scene.getObjectByName('Jar_Body') as T.Mesh).geometry,
    stoneMaterial:materials[0],archMaterial:materials[1],jarMaterial:materials[2],
  }),[scene,materials]);
}
