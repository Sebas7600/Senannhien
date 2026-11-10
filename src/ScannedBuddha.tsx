import {useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import {Box3,Mesh,MathUtils} from 'three';

export default function ScannedBuddha(){
  const {scene}=useGLTF('/assets/models/truc-lam-buddha.glb',false,true);
  const statue=useMemo(()=>{
    const model=scene.clone(true);
    // The scan's head leans right of the altar axis in the original orientation.
    model.rotation.z=MathUtils.degToRad(5.7);
    model.position.y=-new Box3().setFromObject(model,true).min.y-.02;
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
