import {useLayoutEffect,useMemo} from 'react';
import {useGLTF,useTexture} from '@react-three/drei';
import {BackSide,Mesh,MeshStandardMaterial,SRGBColorSpace,Vector3} from 'three';
import {useGame} from './gameStore';
import {POND} from './pondLayout';

const scenery='/assets/scenery/';
const east={x:154,z:POND.z,width:182,height:78,bottom:-8};
const statuePosition=new Vector3(145,22.5,POND.z);
const statueWidth=54;

/** Scenic images sit outside the courtyard walls, without colliders or click targets. */
export default function MountainScenery(){
  const night=useGame(s=>s.night);
  const [range,eastFace]=useTexture([scenery+'mountain-ring.webp',scenery+'east-mountain.webp']);
  const {scene}=useGLTF(scenery+'reclining-buddha.glb?v=granite-2',false,true);
  useLayoutEffect(()=>{
    for(const texture of [range,eastFace]){
      texture.colorSpace=SRGBColorSpace;
      texture.anisotropy=4;
      texture.needsUpdate=true;
    }
  },[range,eastFace]);
  const statue=useMemo(()=>{
    const model=scene.clone(true);
    model.traverse(object=>{
      if(!(object instanceof Mesh)||!(object.material instanceof MeshStandardMaterial))return;
      object.material=object.material.clone();
      object.material.fog=false;
    });
    return model;
  },[scene]);
  useLayoutEffect(()=>{
    statue.traverse(object=>{
      if(!(object instanceof Mesh)||!(object.material instanceof MeshStandardMaterial))return;
      // A little reflected sky light keeps the carved face readable from the lake at night.
      object.material.emissive.set(night?'#4b5465':'#414a47');
      object.material.emissiveIntensity=night?.24:.05;
    });
  },[statue,night]);

  return <group name="Mountain backdrop">
    <mesh position={[0,29,0]} renderOrder={-95}>
      <cylinderGeometry args={[189,189,92,128,1,true]}/>
      <meshBasicMaterial map={range} side={BackSide} color={night?'#6c84ac':'#d4e4ee'} transparent alphaTest={.018} fog={false} depthWrite={false} toneMapped={false}/>
    </mesh>
    <mesh position={[east.x,east.bottom+east.height/2,east.z]} rotation={[0,-Math.PI/2,0]} renderOrder={-90}>
      <planeGeometry args={[east.width,east.height]}/>
      <meshBasicMaterial map={eastFace} color={night?'#92a6c7':'#e8eef2'} transparent alphaTest={.018} fog={false} depthWrite={false} toneMapped={false}/>
    </mesh>
    <primitive object={statue} position={statuePosition} rotation={[0,-Math.PI/2,0]} scale={statueWidth} dispose={null}/>
  </group>;
}
