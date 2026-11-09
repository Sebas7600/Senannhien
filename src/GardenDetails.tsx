import {useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';
import {finishInstanceLayout} from './geometryBatch';
export default function GardenDetails(){
  const rocks=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{const obj=new THREE.Object3D();
    for(let i=0;i<24;i++){const x=(i%2===0?-1:1)*(53+Math.sin(i*1.7)*2),z=-56+Math.floor(i/2)*10;obj.position.set(x,.25,z);obj.scale.set(.55+(i%3)*.18,.3+(i%4)*.13,.65);obj.rotation.set(i*.1,i,0);obj.updateMatrix();rocks.current?.setMatrixAt(i,obj.matrix);}
    finishInstanceLayout(rocks.current);
  },[]);
  return <><instancedMesh ref={rocks} args={[undefined,undefined,24]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#a1aa93" roughness={1}/></instancedMesh></>;
}
