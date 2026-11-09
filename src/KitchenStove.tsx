import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {Steam} from './Food';
import {SacredFlame} from './FireEffects';
import {useReducedMotion} from './useReducedMotion';
import {KITCHEN_COUNTER_TOP} from './gameData';

/** Only the central stove lights up during the three-second cooking stage. */
export function KitchenStove(){
  const effects=useRef<THREE.Group>(null),burner=useRef<THREE.MeshStandardMaterial>(null),reduced=useReducedMotion();
  useFrame(({clock})=>{const m=useGame.getState().meal,now=Date.now(),active=!!m&&m.orderedAt!==undefined&&m.cookedAt!==undefined&&now>=m.orderedAt&&now<m.cookedAt;if(effects.current)effects.current.visible=active;if(burner.current)burner.current.emissiveIntensity=active?(reduced?.55:.55+Math.sin(clock.elapsedTime*6)*.12):0;});
  return <group position={[0,KITCHEN_COUNTER_TOP,-6.55]}>
    <mesh position={[0,.035,0]} castShadow><boxGeometry args={[1,.07,.82]}/><meshStandardMaterial color="#403e35" roughness={.75}/></mesh>
    <mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.29,.025,6,20]}/><meshStandardMaterial ref={burner} color="#6b5740" emissive="#de833a" emissiveIntensity={0}/></mesh>
    <mesh position={[0,.105,0]}><latheGeometry args={[[[.14,0],[.25,.025],[.34,.15],[.35,.23],[.32,.24]].map(([x,y])=>new THREE.Vector2(x,y)),20]}/><meshStandardMaterial color="#69746b" roughness={.45} metalness={.35} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,.31,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.31,20]}/><meshStandardMaterial color="#b3aa6d"/></mesh>
    {[-1,1].map(s=><mesh key={s} position={[s*.38,.23,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.075,.017,5,12]}/><meshStandardMaterial color="#596056" metalness={.45}/></mesh>)}
    <group ref={effects} visible={false}>
      <group position={[0,.33,0]} scale={1.3}><Steam/></group>
      {[-1,1].map(s=><SacredFlame key={s} position={[s*.2,.08,-.1]} scale={.7} seed={s}/>) }
    </group>
  </group>;
}
