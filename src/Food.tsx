import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { dishes, type DishId } from './gameData';
/** A single carried tray supports the entire meal, including the cup beside the plate. */
export function ServingMeal({dish,eating=false}:{dish:DishId;eating?:boolean}){return <group>
  <mesh position={[.04,-.055,0]} castShadow receiveShadow><boxGeometry args={[1.16,.025,1]}/><meshStandardMaterial color="#96754c" roughness={.75}/></mesh>
  <Food dish={dish} eating={eating}/>
</group>}
export function Steam(){const ref=useRef<THREE.Group>(null);useFrame(({clock})=>ref.current?.children.forEach((m,i)=>{const t=(clock.elapsedTime*.25+i*.25)%1;m.position.set(Math.sin(t*5+i)*.1,.12+t*.65,Math.cos(t*5+i)*.07);m.scale.setScalar(.025+t*.045);(m as THREE.Mesh<THREE.SphereGeometry,THREE.MeshBasicMaterial>).material.opacity=(1-t)*.18}));return <group ref={ref}>{[0,1,2].map(i=><mesh key={i}><sphereGeometry args={[1,6,6]}/><meshBasicMaterial color="#fff8e5" transparent depthWrite={false}/></mesh>)}</group>}
export function Food({dish,eating=false}:{dish:DishId;eating?:boolean}){
  const config=dishes.find(d=>d.id===dish)!;
  return <group scale={eating?.86:1}>
    <mesh position={[0,-.025,0]}><cylinderGeometry args={[.48,.48,.035,28]}/><meshStandardMaterial color="#a9946b"/></mesh>
    {dish==='bread'?<group><mesh position={[0,.11,0]} rotation={[0,0,Math.PI/2]} scale={[1,1,.8]} castShadow><capsuleGeometry args={[.13,.5,5,16]}/><meshStandardMaterial color="#c89549" roughness={.9}/></mesh><mesh position={[0,.2,.015]} scale={[.44,.055,.11]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#6c8c4e"/></mesh>{[-.2,0,.2].map(x=><mesh key={x} position={[x,.215,.055]} rotation={[0,0,-.4]}><boxGeometry args={[.1,.04,.19]}/><meshStandardMaterial color="#e4bc75"/></mesh>)}</group>:<group>
      <mesh position={[0,.07,0]}><cylinderGeometry args={[dish==='rice'?.41:.36,.22,dish==='rice'?.06:.2,28,1,true]}/><meshStandardMaterial color="#e8e1c7" side={THREE.DoubleSide}/></mesh>
      <mesh position={[0,.15,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[dish==='rice'?.39:.33,28]}/><meshStandardMaterial color={dish==='rice'?'#e8dfbf':'#b99d60'}/></mesh>
      {dish==='rice'?<mesh position={[-.14,.18,0]} scale={[.22,.12,.23]}><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#f1e8d1"/></mesh>:Array.from({length:10},(_,i)=><mesh key={i} position={[Math.sin(i*2.4)*.17,.17+i*.002,Math.cos(i*2.4)*.17]} rotation={[-Math.PI/2,0,i]} scale={[1,.55,1]}><torusGeometry args={[.11,.012,4,12,4.5]}/><meshStandardMaterial color={config.color}/></mesh>)}
      {[0,1,2].map(i=><mesh key={i} position={[.12+Math.sin(i*2)*.08,.19,Math.cos(i*2)*.18]} rotation={[0,i,0]}><boxGeometry args={[.1,.055,.09]}/><meshStandardMaterial color="#d0ae6c"/></mesh>)}
      {[0,1,2,3].map(i=><mesh key={i} position={[Math.sin(i*1.4)*.23,.2,Math.cos(i*1.4)*.22]} rotation={[0,i,.4]} scale={[.11,.025,.065]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#62834b"/></mesh>)}
      <Steam/>
    </group>}
    <group position={[.49,.08,0]}><mesh><cylinderGeometry args={[.075,.055,.17,14]}/><meshStandardMaterial color="#b9c1a4"/></mesh><mesh position={[0,.086,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.06,14]}/><meshStandardMaterial color="#958756"/></mesh></group>
    {dish!=='bread'&&<><mesh position={[-.46,.035,0]} rotation={[0,0,.25]}><boxGeometry args={[.02,.02,.65]}/><meshStandardMaterial color="#816743"/></mesh><mesh position={[-.41,.035,0]} rotation={[0,0,.25]}><boxGeometry args={[.02,.02,.65]}/><meshStandardMaterial color="#816743"/></mesh></>}
  </group>;
}
