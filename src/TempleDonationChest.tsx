import {useMemo} from 'react';
import {Html} from '@react-three/drei';
import {RigidBody,CuboidCollider} from '@react-three/rapier';
import * as THREE from 'three';
import {useGame,visitDonationChest} from './gameStore';
import {donationChest} from './templeFixtures';
export default function TempleDonationChest(){
 const near=useGame(s=>Math.hypot(s.position[0]-donationChest.spot[0],s.position[1]-donationChest.spot[1])<3);
 const sign=useMemo(()=>{const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d')!;g.fillStyle='#67271f';g.fillRect(0,0,512,256);g.strokeStyle='#d9b86c';g.lineWidth=8;g.strokeRect(8,8,496,240);g.fillStyle='#ffe2a0';g.textAlign='center';g.font='bold 42px serif';g.fillText('HÒM',256,95);g.font='bold 56px serif';g.fillText('CÔNG ĐỨC',256,175);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t},[]);
 return <group position={donationChest.position}>
 <RigidBody type="fixed" colliders={false}><CuboidCollider position={[0,.58,0]} args={[.5,.58,.37]}/></RigidBody>
 <group onClick={e=>{e.stopPropagation();visitDonationChest()}}>
  <mesh position={[0,.58,0]}><boxGeometry args={[.92,1.08,.66]}/><meshStandardMaterial color="#683c28" roughness={.7}/></mesh>
  {[.1,1.07].map(y=><mesh key={y} position={[0,y,0]}><boxGeometry args={[.99,.07,.73]}/><meshStandardMaterial color="#b98c42" metalness={.6} roughness={.4}/></mesh>)}
  <mesh position={[0,1.14,0]}><boxGeometry args={[1.04,.08,.79]}/><meshStandardMaterial color="#7b472d"/></mesh>
  <mesh position={[0,1.182,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.4,.035]}/><meshBasicMaterial color="#17120c"/></mesh>
  <mesh position={[0,.64,.337]}><planeGeometry args={[.78,.39]}/><meshStandardMaterial map={sign} roughness={.75}/></mesh>
  <mesh position={[0,.28,.348]}><boxGeometry args={[.065,.09,.02]}/><meshStandardMaterial color="#d3af5c" metalness={.75}/></mesh>
 </group>
 {near&&<Html position={[0,1.55,0]} center distanceFactor={5}><button className="plot-tag" onClick={visitDonationChest}>Hòm công đức · Ủng hộ · E</button></Html>}
 </group>;
}
