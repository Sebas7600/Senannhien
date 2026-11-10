import {useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import {Mesh} from 'three';

export default function ScannedBuddha(){
  const {scene}=useGLTF('/assets/models/truc-lam-buddha.glb',false,true);
  const statue=useMemo(()=>{
    const model=scene.clone(true);
    model.traverse(object=>{
      if(object instanceof Mesh){
        object.castShadow=true;
        object.receiveShadow=true;
      }
    });
    return model;
  },[scene]);

  return <group position={[0,.45,-.7]}>
    <primitive object={statue} dispose={null}/>
    <mesh position={[0,-.1,0]} receiveShadow castShadow>
      <cylinderGeometry args={[.85,.95,.2,48]}/>
      <meshStandardMaterial color="#96825a" metalness={.35} roughness={.65}/>
    </mesh>
    <mesh position={[0,1.02,-.43]}>
      <torusGeometry args={[.86,.018,8,80]}/>
      <meshStandardMaterial color="#b8a069" metalness={.7} roughness={.3} emissive="#806126" emissiveIntensity={.12}/>
    </mesh>
  </group>;
}
