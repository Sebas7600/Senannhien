import {SacredFlames} from './FireEffects';
import {memo,useRef,useMemo,useLayoutEffect} from 'react';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {templeOffering,distance} from './gameData';
import {offeringStations,offeringStation,nearestOfferingStation,lampPlacement,type OfferingStation} from './templeFixtures';

/** Lamp bodies are batched; their flames use the same effect as the other altars. */
const LampBatch=memo(function LampBatch({entries}:{entries:OfferingEntry[]}){
 const bases=useRef<THREE.InstancedMesh>(null),petals=useRef<THREE.InstancedMesh>(null);
 const positions=useMemo(()=>entries.map(e=>lampPlacement(e.index,e.station.position[0])),[entries]);
 const lights=useMemo(()=>positions.map(([x,y,z],i)=>({position:[x,y+.14,z] as [number,number,number],scale:.65,seed:i*.73})),[positions]);
 useLayoutEffect(()=>{if(!bases.current||!petals.current)return;const part=new THREE.Object3D();entries.forEach((_,i)=>{const [x,y,z]=positions[i];part.rotation.set(0,0,0);part.position.set(x,y+.015,z);part.scale.set(1,1,1);part.updateMatrix();bases.current!.setMatrixAt(i,part.matrix);for(let k=0;k<7;k++){const a=k*Math.PI*2/7;part.position.set(x+Math.sin(a)*.075,y+.08,z+Math.cos(a)*.075);part.rotation.set(Math.cos(a)*.5,0,-Math.sin(a)*.5);part.scale.set(.045,.07,.045);part.updateMatrix();petals.current!.setMatrixAt(i*7+k,part.matrix)}});for(const m of [bases.current,petals.current]){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere()}},[entries,positions]);
 return <group><instancedMesh ref={bases} args={[undefined,undefined,entries.length]}><cylinderGeometry args={[.075,.065,.03,16]}/><meshStandardMaterial color="#c89f53" metalness={.65} roughness={.35}/></instancedMesh><instancedMesh ref={petals} args={[undefined,undefined,entries.length*7]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#c89f53" metalness={.65} roughness={.35}/></instancedMesh><SacredFlames points={lights}/></group>;
});

interface OfferingEntry{time:number;index:number;station:OfferingStation}
const FlowerBatch=memo(function FlowerBatch({entries}:{entries:OfferingEntry[]}){
 const stems=useRef<THREE.InstancedMesh>(null),petals=useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(()=>{if(!stems.current||!petals.current)return;const root=new THREE.Object3D(),part=new THREE.Object3D();entries.forEach((entry,i)=>{
  const a=entry.index*2.4,r=entry.index===0?0:.025+Math.floor(entry.index/3)*.012;
  root.position.set(entry.station.position[0]+Math.sin(a)*r,entry.station.position[1]-.045,entry.station.position[2]+Math.cos(a)*r);root.rotation.set(Math.cos(a)*.12,a,Math.sin(a)*.12);root.updateMatrix();
  part.position.set(0,.12,0);part.rotation.set(0,0,0);part.scale.set(1,1,1);part.updateMatrix();stems.current!.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(root.matrix,part.matrix));
  for(let k=0;k<7;k++){const angle=k*Math.PI*2/7;part.position.set(Math.sin(angle)*.032,.32+(entry.index%3)*.035,Math.cos(angle)*.032);part.rotation.set(Math.cos(angle)*.35,0,-Math.sin(angle)*.35);part.scale.set(.024,.06,.022);part.updateMatrix();petals.current!.setMatrixAt(i*7+k,new THREE.Matrix4().multiplyMatrices(root.matrix,part.matrix))}
 });for(const m of [stems.current,petals.current]){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere()}},[entries]);
 return <group><instancedMesh ref={stems} args={[undefined,undefined,entries.length]}><cylinderGeometry args={[.007,.009,.34,6]}/><meshStandardMaterial color="#517443"/></instancedMesh><instancedMesh ref={petals} args={[undefined,undefined,entries.length*7]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#e8bac1" roughness={.7}/></instancedMesh></group>;
});
export default function TempleOfferingStations(){const s=useGame();const entries=useMemo(()=>{
 const result:{flower:OfferingEntry[];candle:OfferingEntry[]}={flower:[],candle:[]};for(const kind of ['flower','candle'] as const){const counts:Record<string,number>={};for(const time of s.offerings[kind]){const station=offeringStation(kind,s.offeringSlots[time]);const index=counts[station.id]||0;counts[station.id]=index+1;result[kind].push({time,index,station})}}return result;
 },[s.offerings,s.offeringSlots]);return <group>
 {entries.flower.length>0&&<FlowerBatch entries={entries.flower}/>}
 {entries.candle.length>0&&<LampBatch entries={entries.candle}/>}
 {(['flower','candle'] as const).map(kind=>{const nearest=nearestOfferingStation(kind,s.position,s.offeringFocus);return <group key={kind}>
 {offeringStations[kind].map(station=><mesh key={station.id} position={[station.position[0],station.position[1]-(kind==='flower'?.2:0),station.position[2]]} onClick={e=>{if(e.delta>5)return;e.stopPropagation();s.perform(kind,station.id)}}><sphereGeometry args={[kind==='flower'?.24:.42,8,6]}/><meshBasicMaterial visible={false}/></mesh>)}
 {distance(s.position,nearest.spot)<3&&!['flower','candle','incense'].includes(s.action)&&<Html position={[nearest.position[0],nearest.position[1]+.6,nearest.position[2]]} center distanceFactor={5}><button className="plot-tag" onClick={()=>s.perform(kind,nearest.id)}>{templeOffering[kind].label} · {nearest.label} · {entries[kind].filter(e=>e.station.id===nearest.id).length}/8</button></Html>}
 </group>})}
 </group>}
