import {useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';
import {Box} from './models';
import {finishInstanceLayout} from './geometryBatch';
export const beds=[[-20,25],[12,30.5],[-12,-10],[12,-10],[24,-39],[44,-39],[-46,-31],[-22,-31],[-42,30],[-28,30],[44,49],[-13,-45],[13,-45]];
export default function GardenDetails(){
  const flowers=useRef<THREE.InstancedMesh>(null),stems=useRef<THREE.InstancedMesh>(null),bushes=useRef<THREE.InstancedMesh>(null),rocks=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{const obj=new THREE.Object3D();beds.forEach(([x,z],b)=>{for(let i=0;i<20;i++){const index=b*20+i,xx=x+(i%5-2)*.5,zz=z+(Math.floor(i/5)-1.5)*.35;obj.position.set(xx,.33,zz);obj.scale.set(.018,.4,.018);obj.updateMatrix();stems.current?.setMatrixAt(index,obj.matrix);obj.position.y=.55+(i%3)*.07;obj.scale.set(.095,.075,.095);obj.updateMatrix();flowers.current?.setMatrixAt(index,obj.matrix);flowers.current?.setColorAt(index,new THREE.Color(['#d9b2a2','#e1d1a6','#c1c18a','#e4c5b4'][(b+i)%4]));}});
    for(let i=0;i<100;i++){const side=i%2===0?-1:1,x=side*(49+Math.sin(i*2.4)*3.5),z=-57+Math.floor(i/2)*2.3;obj.position.set(x,.5,z);obj.scale.set(.65+(i%3)*.15,.55,.75);obj.rotation.set(0,i,0);obj.updateMatrix();bushes.current?.setMatrixAt(i,obj.matrix);bushes.current?.setColorAt(i,new THREE.Color(['#7b9463','#94a373','#6e895e'][i%3]));}
    for(let i=0;i<24;i++){const x=(i%2===0?-1:1)*(53+Math.sin(i*1.7)*2),z=-56+Math.floor(i/2)*10;obj.position.set(x,.25,z);obj.scale.set(.55+(i%3)*.18,.3+(i%4)*.13,.65);obj.rotation.set(i*.1,i,0);obj.updateMatrix();rocks.current?.setMatrixAt(i,obj.matrix);}
    for(const ref of [flowers,stems,bushes,rocks])finishInstanceLayout(ref.current);
  },[]);
  return <>{beds.map(([x,z],i)=><group key={i} position={[x,0,z]}><Box position={[0,.14,0]} scale={[3,.28,1.6]} color="#b0b093"/><Box position={[0,.3,0]} scale={[2.8,.07,1.4]} color="#9b9472"/></group>)}<instancedMesh ref={stems} args={[undefined,undefined,beds.length*20]}><cylinderGeometry args={[1,1,1,4]}/><meshStandardMaterial color="#7b995e"/></instancedMesh><instancedMesh ref={flowers} args={[undefined,undefined,beds.length*20]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={1}/></instancedMesh><instancedMesh ref={bushes} args={[undefined,undefined,100]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={1}/></instancedMesh><instancedMesh ref={rocks} args={[undefined,undefined,24]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#a1aa93" roughness={1}/></instancedMesh></>;
}
