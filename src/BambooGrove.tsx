import {useLayoutEffect,useRef} from 'react';
import * as T from 'three';
import {bambooStalks} from './mayaPaths';
export default function BambooGrove(){
 const stems=useRef<T.InstancedMesh>(null),joints=useRef<T.InstancedMesh>(null);
 useLayoutEffect(()=>{const pose=new T.Object3D(),green=new T.Color();bambooStalks.forEach((b,i)=>{
  pose.position.set(b.x,b.height/2,b.z);pose.rotation.set(b.lean,i*2.399,b.lean);pose.scale.set(.065,b.height,.065);pose.updateMatrix();stems.current!.setMatrixAt(i,pose.matrix);green.set(i%3?'#768559':'#5d744c');stems.current!.setColorAt(i,green);
  for(let j=0;j<6;j++){pose.position.set(b.x,(j+1)*b.height/7,b.z);pose.scale.set(.076,.028,.076);pose.updateMatrix();joints.current!.setMatrixAt(i*6+j,pose.matrix);}
 });for(const mesh of [stems.current!,joints.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}},[]);
 return <group name="Rung-tre-tranh-duong-soi"><instancedMesh ref={stems} args={[undefined,undefined,bambooStalks.length]} castShadow><cylinderGeometry args={[.75,1,1,7]}/><meshStandardMaterial roughness={.96}/></instancedMesh><instancedMesh ref={joints} args={[undefined,undefined,bambooStalks.length*6]}><cylinderGeometry args={[1,1,1,7]}/><meshStandardMaterial color="#9caa78" roughness={1}/></instancedMesh></group>;
}
