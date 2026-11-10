import {useLayoutEffect} from 'react';
import {useTexture} from '@react-three/drei';
import {BackSide,SRGBColorSpace} from 'three';
import {useGame} from './gameStore';
import {POND} from './pondLayout';

const scenery='/assets/scenery/';
const east={x:154,z:POND.z,width:182,height:78,bottom:-8};

/** Scenic images sit outside the courtyard walls, without colliders or click targets. */
export default function MountainScenery(){
  const night=useGame(s=>s.night);
  const [range,eastFace]=useTexture([scenery+'mountain-ring.webp',scenery+'east-mountain-buddha.webp']);
  useLayoutEffect(()=>{
    for(const texture of [range,eastFace]){
      texture.colorSpace=SRGBColorSpace;
      texture.anisotropy=4;
      texture.needsUpdate=true;
    }
  },[range,eastFace]);

  return <group name="Mountain backdrop">
    <mesh position={[0,29,0]} renderOrder={-95}>
      <cylinderGeometry args={[189,189,92,128,1,true]}/>
      <meshBasicMaterial map={range} side={BackSide} color={night?'#6c84ac':'#d4e4ee'} transparent alphaTest={.018} fog={false} depthWrite={false} toneMapped={false}/>
    </mesh>
    <mesh position={[east.x,east.bottom+east.height/2,east.z]} rotation={[0,-Math.PI/2,0]} renderOrder={-90}>
      <planeGeometry args={[east.width,east.height]}/>
      <meshBasicMaterial map={eastFace} color={night?'#92a6c7':'#e8eef2'} transparent alphaTest={.018} fog={false} depthWrite={false} toneMapped={false}/>
    </mesh>
  </group>;
}
