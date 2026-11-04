import {useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {incenseSpot} from './gameData';
import {incensePlacement,INCENSE_ASH_Y} from './IncenseBurner';
import {incenseLife} from './incenseLifecycle';

/** Fixed red bamboo feet, shrinking incense, embers and cooled ash: four shared batches. */
export default function IncenseSticks({times}:{times:number[]}){
 const low=useGame(s=>s.quality==='low'),base=useRef<THREE.InstancedMesh>(null),body=useRef<THREE.InstancedMesh>(null),tip=useRef<THREE.InstancedMesh>(null),ash=useRef<THREE.InstancedMesh>(null),last=useRef(-1);
 const scratch=useMemo(()=>({root:new THREE.Object3D(),part:new THREE.Object3D(),matrix:new THREE.Matrix4()}),[]);
 const placements=useMemo(()=>times.map(at=>incensePlacement(at)),[times]);
 const update=(now:number,includeBase=false)=>{if(!base.current||!body.current||!tip.current||!ash.current)return;const {root,part,matrix}=scratch;
  times.forEach((at,i)=>{const p=placements[i],life=incenseLife(at,now);root.position.set(incenseSpot[0]+p.x,INCENSE_ASH_Y,incenseSpot[1]+p.z);root.rotation.set(p.leanX,0,p.leanZ);root.updateMatrix();
   const put=(mesh:THREE.InstancedMesh,y:number,xs:number,ys:number,zs:number)=>{part.position.set(0,y,0);part.scale.set(xs,ys,zs);part.updateMatrix();matrix.multiplyMatrices(root.matrix,part.matrix);mesh.setMatrixAt(i,matrix)};
   // 7 cm buried in the sand; 16 cm of red bamboo remains above it after burning.
   if(includeBase)put(base.current!,.045,1,1,1);
   const height=(p.length-.16)*life.remaining;
   put(body.current!,.16+height/2,life.burning?.012:0,height,.012);
   put(tip.current!,.16+height,life.burning?.018:0,life.burning?.018:0,life.burning?.018:0);
   put(ash.current!,.165,life.burning?0:1,life.burning?0:1,life.burning?0:1);
  });for(const m of [body.current,tip.current,ash.current])m.instanceMatrix.needsUpdate=true;if(includeBase){base.current.instanceMatrix.needsUpdate=true;for(const m of [base.current,body.current,tip.current,ash.current])m.computeBoundingSphere()}
 };
 useLayoutEffect(()=>{last.current=-1;update(Date.now(),true)},[times,placements]);
 useFrame(({clock})=>{if(clock.elapsedTime-last.current<1/(low?15:30))return;last.current=clock.elapsedTime;update(Date.now())});
 return <group>
  <instancedMesh ref={base} args={[undefined,undefined,times.length]}><cylinderGeometry args={[.011,.012,.23,6]}/><meshStandardMaterial color="#a52d24" roughness={.85}/></instancedMesh>
  <instancedMesh ref={body} args={[undefined,undefined,times.length]}><cylinderGeometry args={[1,1,1,6]}/><meshStandardMaterial color="#936b45" roughness={1}/></instancedMesh>
  <instancedMesh ref={tip} args={[undefined,undefined,times.length]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#e98a42" emissive="#e45c20" emissiveIntensity={1.1}/></instancedMesh>
  <instancedMesh ref={ash} args={[undefined,undefined,times.length]}><cylinderGeometry args={[.013,.011,.025,6]}/><meshStandardMaterial color="#7b7770" roughness={1}/></instancedMesh>
 </group>;
}
