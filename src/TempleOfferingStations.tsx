import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {templeOffering,distance} from './gameData';
import {LotusBloom} from './VietnameseAltar';
function Lamp({at}:{at:number}){const flame=useRef<THREE.Mesh>(null);useFrame(({clock})=>{if(flame.current){const remaining=Math.max(0,1-(Date.now()-at)/templeOffering.candle.lifetime);flame.current.scale.set(.035,.07*(.9+Math.sin(clock.elapsedTime*8)*.1)*Math.min(1,remaining*8),.035)}});return <group>{Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7;return <mesh key={i} position={[Math.sin(a)*.075,.04,Math.cos(a)*.075]} rotation={[Math.cos(a)*.5,0,-Math.sin(a)*.5]} scale={[.045,.07,.045]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#c89f53" metalness={.65} roughness={.35}/></mesh>})}<mesh ref={flame} position={[0,.13,0]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#ffe3a5" emissive="#ffad3c" emissiveIntensity={2}/></mesh></group>}
export default function TempleOfferingStations(){const s=useGame();return <group>{(['flower','candle'] as const).map(kind=>{const config=templeOffering[kind],at=s.offerings[kind];return <group key={kind} position={[config.spot[0],0,config.spot[1]+27]}>
 {at.map((time,i)=><group key={time} position={[(i%4-1.5)*.35,3.07,i<4?-.15:.15]}>{kind==='flower'?<group><mesh position={[0,.08,0]}><cylinderGeometry args={[.065,.085,.16,16]}/><meshStandardMaterial color="#e1d9c3" roughness={.3}/></mesh><group position={[0,.24,0]}><LotusBloom scale={.5}/></group></group>:<Lamp at={time}/>}</group>)}
 {distance(s.position,config.spot)<4&&<Html position={[0,3.7,0]} center distanceFactor={9}><button className="plot-tag" onClick={()=>s.perform(kind)}>{config.label} · Còn {s.inventory[kind]} · {at.length}/8</button></Html>}
 </group>})}</group>}
