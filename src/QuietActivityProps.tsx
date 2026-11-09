import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {DoubleSide,type Group,type Mesh} from 'three';
import type {QuietActivityFrame} from './quietActivityMotion';
import {useReducedMotion} from './useReducedMotion';

export function ReadingBook({motion}:{motion:QuietActivityFrame}){
  const leaf=useRef<Group>(null);
  useFrame(()=>{if(leaf.current){leaf.current.visible=motion.page>0&&motion.page<1;leaf.current.rotation.z=motion.page*Math.PI;}});
  return <group>
    {[-1,1].map(side=><group key={side} position={[side*.07,0,0]} rotation={[0,0,-side*.08]}>
      <mesh position={[0,-.009,0]}><boxGeometry args={[.142,.014,.18]}/><meshStandardMaterial color="#6a7852"/></mesh>
      <mesh><boxGeometry args={[.132,.014,.17]}/><meshStandardMaterial color="#f5e8c8"/></mesh>
      {[0,1,2,3].map(i=><mesh key={i} position={[0,.0078,-.05+i*.03]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.093,.002]}/><meshStandardMaterial color="#aa9870" side={DoubleSide}/></mesh>)}
    </group>)}
    <mesh><boxGeometry args={[.012,.02,.18]}/><meshStandardMaterial color="#899066"/></mesh>
    <group ref={leaf} position={[0,.012,0]}><mesh position={[.065,0,0]}><boxGeometry args={[.13,.0015,.167]}/><meshStandardMaterial color="#fff2d4"/></mesh></group>
  </group>;
}

export function TeaCup(){
  const steam=useRef<Group>(null),reduced=useReducedMotion();
  useFrame(({clock})=>{if(!steam.current)return;steam.current.visible=!reduced;steam.current.children.forEach((child,i)=>{const p=(clock.elapsedTime*.38+i/3)%1;child.position.set(Math.sin(p*5+i)*.006,.065+p*.07,0);(child as Mesh).scale.setScalar(.6+p*.5);});});
  return <group>
    <mesh position={[0,.024,0]}><cylinderGeometry args={[.035,.025,.048,16,1,true]}/><meshStandardMaterial color="#b8c6a1" side={DoubleSide}/></mesh>
    <mesh position={[0,.043,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.0315,16]}/><meshStandardMaterial color="#7a6330" roughness={.24}/></mesh>
    <mesh position={[0,.048,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.034,.003,5,16]}/><meshStandardMaterial color="#d9dfc2"/></mesh>
    <mesh position={[.038,.024,0]}><torusGeometry args={[.014,.004,5,12]}/><meshStandardMaterial color="#a5b68e"/></mesh>
    <group ref={steam}>{[0,1,2].map(i=><mesh key={i}><sphereGeometry args={[.006,5,4]}/><meshBasicMaterial color="#f7f3df" transparent opacity={.2} depthWrite={false}/></mesh>)}</group>
  </group>;
}
