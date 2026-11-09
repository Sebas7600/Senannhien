import TempleGarden from './TempleGarden';
import MainTempleReference from './MainTempleReference';
import IncenseBurner from './IncenseBurner';
import {TeaGallery} from './TeaGallery';
import {TemplePlaque} from './TemplePlaque';
import {KitchenStove} from './KitchenStove';
import {TempleBell, BellFrame} from './TempleBell';
import {TableAccessories,AltarOfferings,ReceptionDesk} from './TempleDecor';
import {mealPlan,MEAL_SCALE} from './mealService';
import QuanAmShrine from './QuanAmShrine';
import WaterTaskWorld from './WaterTaskWorld';
import {ImportedGate,ImportedBell,ImportedDrum} from './ImportedCourtyardProps';
import GardenDetails from './GardenDetails';
import BodhiTree from './BodhiTree';
import CourtyardTrees from './CourtyardTrees';
import {CourtyardDapple} from './CourtyardLighting';
import {pondTerrain} from './pondGeometry';
import StonePavement from './StonePavement';
import {finishInstanceLayout} from './geometryBatch';
import {BODHI} from './bodhiData';
import BenchBatches from './BenchBatches';
import CushionBatches from './CushionBatches';
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { Box, Buddha, Lantern, Roof, Tree } from './models';
import { ServingMeal, Steam } from './Food';
import { Character } from './Character';
import { gardenPlots, obstacles, places, seats, readingTables, teaTables, diningTables, floorSurfaces, KITCHEN_COUNTER_TOP, WORLD, type Vec3 } from './gameData';
import { useGame } from './gameStore';

export function WorldLabel({position,title,subtitle}:{position:Vec3;title:string;subtitle?:string}){
  const ref=useRef<THREE.Group>(null),worldPoint=useRef(new THREE.Vector3()),previous=useRef(true);const [shown,show]=useState(true);
  useFrame(({camera})=>{if(!ref.current)return;const p=useGame.getState().position;ref.current.getWorldPosition(worldPoint.current);const distance=Math.hypot(p[0]-worldPoint.current.x,p[1]-worldPoint.current.z),visible=distance<43&&camera.position.distanceTo(worldPoint.current)>10;if(previous.current!==visible){previous.current=visible;show(visible)}});
  return <group ref={ref} position={position}>{shown&&<Html center distanceFactor={9} zIndexRange={[3,0]}><div className="world-label"><strong>{title}</strong>{subtitle&&<span>{subtitle}</span>}</div></Html>}</group>;
}export function NearbyOverlay({position,children,distanceFactor=12,maxDistance=24}:{position:Vec3;children:React.ReactNode;distanceFactor?:number;maxDistance?:number}){
  const ref=useRef<THREE.Group>(null),point=useRef(new THREE.Vector3()),previous=useRef(false);const[shown,show]=useState(false);
  useFrame(()=>{if(!ref.current)return;ref.current.getWorldPosition(point.current);const p=useGame.getState().position,visible=Math.hypot(p[0]-point.current.x,p[1]-point.current.z)<maxDistance;if(visible!==previous.current){previous.current=visible;show(visible)}});
  return <group ref={ref} position={position}>{shown&&<Html center distanceFactor={distanceFactor} zIndexRange={[3,0]}>{children}</Html>}</group>;
}function RoofSection({x,z,w,d,children}:{x:number;z:number;w:number;d:number;children:React.ReactNode}){const ref=useRef<THREE.Group>(null);useFrame(()=>{if(!ref.current)return;const s=useGame.getState();ref.current.visible=!(Math.abs(s.position[0]-x)<w/2+1&&Math.abs(s.position[1]-z)<d/2+2)});return <group ref={ref}>{children}</group>}
function WalkSurface(){const click=(e:ThreeEvent<MouseEvent>)=>{if(e.delta>5)return;e.stopPropagation();const s=useGame.getState();s.stand();s.set({destination:[e.point.x,e.point.z],pendingSeat:null});};return <mesh position={[0,.065,0]} rotation={[-Math.PI/2,0,0]} onClick={click}><planeGeometry args={[124,132]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
export function Ground(){return <group><IncenseBurner/>
  <mesh position={[0,-.67,0]} receiveShadow rotation={[-Math.PI/2,0,0]}><planeGeometry args={[350,350]}/><meshStandardMaterial color="#9faa78"/></mesh>
  <mesh geometry={pondTerrain} position-y={.01} receiveShadow><meshStandardMaterial color="#a7af7b"/></mesh>
  <StonePavement/><CourtyardDapple/><WalkSurface/>
  {[-1,1].map(s=><group key={s}><Box position={[s*60,.8,-2]} scale={[.35,1.6,128]} color="#b7b89c"/>{Array.from({length:33},(_,i)=><Box key={i} position={[s*60,1.35,-64+i*4]} scale={[.65,2.7,.65]} color="#acb095"/>)}</group>)}
  {[-66,62].map(z=><Box key={z} position={[0,.8,z]} scale={[120,1.6,.35]} color="#b7b89c"/>)}
  <RigidBody type="fixed" colliders={false}>
    <CuboidCollider position={[0,-.24,-2]} args={[62,.3,66]}/>
    <CuboidCollider position={[-60,1,-2]} args={[.3,3,65]}/><CuboidCollider position={[60,1,-2]} args={[.3,3,65]}/><CuboidCollider position={[0,1,-66]} args={[60,3,.3]}/><CuboidCollider position={[0,1,62]} args={[60,3,.3]}/>
    {obstacles.filter(o=>!o.navigationOnly).map((o,i)=>{const h=o.height??1.4;return <CuboidCollider key={i} position={[o.x,(o.base??0)+h/2,o.z]} args={[o.w/2,h/2,o.d/2]}/>})}
    {floorSurfaces.map((f,i)=><CuboidCollider key={`floor-${i}`} position={[f.x,f.height/2,f.z]} args={[f.w/2,f.height/2,f.d/2]}/>)}

  </RigidBody>
</group>}
function MainTemple(){return <MainTempleReference/>}

function Pavilion({x,z,w,d,title,subtitle,children,floor=.4}:{x:number;z:number;w:number;d:number;title:string;subtitle:string;children:React.ReactNode;floor?:number}){return <group position={[x,0,z]}>
  <Box position={[0,floor/2,0]} scale={[w,floor,d]} color="#b3aa8b"/>
  <Box position={[0,2.3,-d/2+.15]} scale={[w,4,.2]} color="#ceba94"/>
  {[-1,1].flatMap(s=>[-1,0,1].map(i=><Box key={`${s}-${i}`} position={[s*(w/2-.4),2.3,i*(d/2-.5)]} scale={[.3,4.2,.3]} color="#81583b"/>))}
  <RoofSection x={x} z={z} w={w} d={d}><Roof y={4.7} width={w+3} depth={d+3} height={1.8}/><Box position={[0,4.3,d/2-.2]} scale={[w,.32,.3]} color="#7a5238"/></RoofSection>
  {[-1,1].map(s=><Lantern key={s} position={[s*(w/2-1.7),3.7,d/2]}/>)}
  <WorldLabel position={[0,4.1,d/2+.3]} title={title} subtitle={subtitle}/>
  {children}
</group>}
function DiningHall(){return <Pavilion x={34} z={-27} w={23} d={18} floor={.16} title="NHÀ ĂN HƯƠNG THIỀN" subtitle="Bữa chay thanh đạm · Mời bạn ngồi">
  <TemplePlaque kind="dining" position={[0,3.82,-8.7]}/>
  <Box position={[0,(.16+KITCHEN_COUNTER_TOP-.08)/2,-6.1]} scale={[17,KITCHEN_COUNTER_TOP-.24,1.5]} color="#aa9471"/><Box position={[0,KITCHEN_COUNTER_TOP-.06,-6.1]} scale={[17.3,.12,1.8]} color="#d3c8a5"/>
  <KitchenStove/>
  {[-5,5].map(x=><group key={x} position={[x,KITCHEN_COUNTER_TOP+.19,-6]}><mesh><cylinderGeometry args={[.5,.43,.38,20]}/><meshStandardMaterial color="#7c8981" metalness={.25}/></mesh><mesh position={[0,.22,0]}><cylinderGeometry args={[.5,.5,.05,20]}/><meshStandardMaterial color="#b7bba4"/></mesh></group>)}

  {[-9.8,9.8].map(x=><group key={x}><Box position={[x,1,-7.6]} scale={[1,1.6,1]} color="#82906c"/><mesh position={[x,2.2,-7.6]} scale={[.6,.8,.6]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#7a975e"/></mesh></group>)}
  {diningTables.map((table,i)=><group key={i} position={[table[0]-34,0,table[2]+27]}>
    <Box position={[0,.58,0]} scale={[2.5,.12,2.8]} color="#a38d65"/>
    {[-1,1].flatMap(s=>[-1,1].map(t=><Box key={`${s}-${t}`} position={[s*.95,.36,t*1.05]} scale={[.13,.4,.13]} color="#7d6747"/>))}
  </group>)}
  <WorldLabel position={[-5,2,-6]} title="BẾP CHAY" subtitle="Mì · Cơm · Hủ tiếu · Bánh mì"/>
</Pavilion>}
function Library(){return <Pavilion x={-34} z={-43} w={17} d={14} floor={.35} title="TÀNG KINH CÁC" subtitle="20 bàn đọc đơn · Một trang tĩnh lặng">
  <TemplePlaque kind="library" position={[0,3.82,-6.7]}/>
  {[-6,-2,2,6].map((x,i)=><group key={x} position={[x,0,-5.3]} onClick={e=>{e.stopPropagation();useGame.getState().perform('read')}}>
    <Box position={[0,1.6,0]} scale={[2.7,2.5,.7]} color="#8b6d49"/>{[.7,1.5,2.3].flatMap(y=>Array.from({length:9},(_,j)=><Box key={`${y}-${j}`} position={[-1.05+j*.26,y+.2,.41]} scale={[.18,.53,.2]} color={['#7d8e6c','#ac9570','#7b8f8b','#b99e7d'][(i+j)%4]}/>))}
  </group>)}
  {readingTables.map((t,i)=><group key={i} position={[t[0]+34,0,t[2]+43]} onClick={e=>{e.stopPropagation();useGame.getState().sit(`reading-${i}`,'read')}}>
    <Box position={[0,.71,0]} scale={[1.4,.1,.7]} color="#aa946e"/>
    {[-.52,.52].map(x=><Box key={x} position={[x,.52,0]} scale={[.1,.34,.5]} color="#8d7857"/>)}
    <Box position={[0,.79,0]} scale={[.4,.025,.34]} color="#e0d6b7"/>
    <Box position={[0,.81,0]} scale={[.015,.015,.34]} color="#baa476"/>
  </group>)}
</Pavilion>}
function MeditationHall(){return <Pavilion x={-33} z={-17} w={20} d={16} title="THIỀN ĐƯỜNG TRÚC LÂM" subtitle="20 bồ đoàn · Thiền · Tụng kinh · Gõ mõ">
  <group position={[0,.4,-5.9]} scale={1.4}><Buddha/></group><Box position={[0,1,-5]} scale={[6,.3,.9]} color="#8a6445"/>
  {[-8,8].map(x=><group key={x}><Box position={[x,2.3,-6.5]} scale={[1.2,2.2,.12]} color="#7c7856"/>{[0,1,2].map(i=><mesh key={i} position={[x,3-i*.5,-6.4]}><torusGeometry args={[.13,.015,5,16]}/><meshStandardMaterial color="#d9c59a"/></mesh>)}</group>)}
</Pavilion>}
function Gate(){return <ImportedGate/>}
function BellPavilion({x,drum=false}:{x:number;drum?:boolean}){
  return <group position={[x,0,-13]} onClick={e=>{if(!drum){e.stopPropagation();useGame.getState().perform('bell')}}}>
    <Box position={[0,.2,0]} scale={[5,.4,5]} color="#b4b598"/>
    {[-1,1].flatMap(s=>[-1,1].map(t=><Box key={`${s}-${t}`} position={[s*1.8,2.2,t*1.8]} scale={[.25,4,.25]} color="#815538"/>))}
    <RoofSection x={x} z={-13} w={5} d={5}><Roof y={4.3} width={6.7} depth={6.5} height={1.6}/></RoofSection>
    {drum?<ImportedDrum/>:<ImportedBell/>}
    <WorldLabel position={[0,3,2.5]} title={drum?'LẦU TRỐNG':'LẦU CHUÔNG'} subtitle={drum?'Nhịp chậm ngày an':'E · Thỉnh một tiếng chuông'}/>
  </group>
}
function Stupa(){return <group position={[-35,0,42]}><Box position={[0,.3,0]} scale={[9,.6,9]} color="#b8b297"/>{Array.from({length:7},(_,i)=><group key={i} position={[0,i*1.85+.6,0]}><Box position={[0,.65,0]} scale={[5.7-i*.5,1.4,5.7-i*.5]} color="#c1ac82"/>{[-1,1].map(s=><Box key={s} position={[0,.73,s*(2.9-i*.25)]} scale={[.55,.85,.05]} color="#726348"/>)}<Roof y={1.3} width={7.4-i*.65} depth={7.4-i*.65} height={.75}/></group>)}<mesh position={[0,14.2,0]}><coneGeometry args={[.35,2,8]}/><meshStandardMaterial color="#c2a268"/></mesh><WorldLabel position={[0,2,5]} title="BẢO THÁP AN LẠC" subtitle="Bảy tầng tĩnh lặng"/></group>}
function TeaTerrace(){return <Pavilion x={0} z={-56} w={20} d={13} floor={.3} title="TRÀ ĐÌNH VỌNG SƠN" subtitle="10 bàn đôi · Hai bồ đoàn đối diện · Một tách trà an nhiên">
  <TeaGallery/>
  {teaTables.map((t,i)=><group key={i} position={[t[0],0,t[2]+56]}>
    <Box position={[0,t[1]-.06,0]} scale={[1.6,.12,1.2]} color="#9f8861"/>
    {[-.6,.6].flatMap(x=>[-.4,.4].map(z=><Box key={`${x}-${z}`} position={[x,(.3+t[1]-.12)/2,z]} scale={[.1,t[1]-.42,.1]} color="#816c4e"/>))}

    {[-.35,.35].map(z=><group key={z} position={[.32,t[1]+.07,z]}><mesh><cylinderGeometry args={[.07,.05,.1,10]}/><meshStandardMaterial color="#c6c8ac"/></mesh><Steam/></group>)}
  </group>)}
</Pavilion>}

export function Seats(){return <><BenchBatches/><CushionBatches/></>}
// The local plate is animated by Cô Tâm and stays the same mesh after placement.
export function MealPlates(){const peers=useGame(s=>s.peers);return <>{peers.filter(p=>p.meal&&(p.meal.status==='ready'||p.meal.status==='eating')).map(p=>{const meal=p.meal!,seat=seats.find(s=>s.id===meal.seatId);if(!seat?.table)return null;const plan=mealPlan(seat.id);return <group key={p.id} position={plan.plate} rotation={[0,plan.heading,0]} scale={MEAL_SCALE}><ServingMeal dish={meal.dish} eating={meal.status==='eating'}/></group>})}</>}
export function Garden(){return <><TempleGarden/><WorldLabel position={[36,2.3,-42]} title="VƯỜN RAU TỪ TÂM" subtitle="Vườn chung · Gieo · Tưới · Thu hoạch sau 60 giây"/></>}
function Forest(){
  const trunks=useRef<THREE.InstancedMesh>(null),leaves=useRef<THREE.InstancedMesh>(null);
  const coords=useMemo(()=>{
    const positions:Vec3[]=[];
    for(let i=0;i<138;i++){
      const angle=i*2.399,radius=64+(i%9)*3;
      positions.push([Math.sin(angle)*radius,0,Math.cos(angle)*radius-5]);
    }
    for(let i=0;i<30;i++)positions.push([-47+Math.sin(i*2.4)*8,0,-5+i*1.6]);
    for(let i=0;i<7;i++)positions.push([62+i%2*4,0,2+i*8]);
    return positions;
  },[]);
  useLayoutEffect(()=>{
    const pose=new THREE.Object3D(),palette=['#517454','#68825a','#84966a'].map(color=>new THREE.Color(color));
    coords.forEach(([x,y,z],i)=>{
      const size=.75+i%4*.18;
      pose.position.set(x,2*size,z);
      pose.scale.set(.28*size,4*size,.28*size);
      pose.rotation.set(0,i,0);
      pose.updateMatrix();
      trunks.current?.setMatrixAt(i,pose.matrix);
      for(let j=0;j<3;j++){
        const angle=j*2.4+i;
        pose.position.set(x+Math.sin(angle)*size,y+(4+j*.5)*size,z+Math.cos(angle)*size);
        pose.scale.set(2.5*size,1.5*size,2.3*size);
        pose.updateMatrix();
        leaves.current?.setMatrixAt(i*3+j,pose.matrix);
        leaves.current?.setColorAt(i*3+j,palette[(i+j)%3]);
      }
    });
    finishInstanceLayout(trunks.current);
    finishInstanceLayout(leaves.current);
  },[coords]);
  return <>
    <instancedMesh ref={trunks} args={[undefined,undefined,coords.length]} castShadow>
      <cylinderGeometry args={[1,1.3,1,6]}/><meshStandardMaterial color="#7f7258"/>
    </instancedMesh>
    <instancedMesh ref={leaves} args={[undefined,undefined,coords.length*3]} castShadow>
      <icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={1}/>
    </instancedMesh>
  </>;
}
function Bamboo(){
  const stalks=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const mesh=stalks.current;
    if(!mesh)return;
    const pose=new THREE.Object3D();
    for(let i=0;i<80;i++){
      const angle=i*2.399,radius=6+(i%9)*.9;
      pose.position.set(-38+Math.sin(angle)*radius,2.4+(i%3)*.3,12+Math.cos(angle)*radius);
      pose.scale.set(.06,4.8+(i%3)*.6,.06);
      pose.rotation.set(Math.sin(i)*.04,0,Math.cos(i)*.05);
      pose.updateMatrix();
      mesh.setMatrixAt(i,pose.matrix);
    }
    finishInstanceLayout(mesh);
  },[]);
  return <group>
    <instancedMesh ref={stalks} args={[undefined,undefined,80]}>
      <cylinderGeometry args={[1,1,1,6]}/><meshStandardMaterial color="#72885b"/>
    </instancedMesh>
    {Array.from({length:15},(_,i)=>{
      const angle=i*2.4;
      return <mesh key={i} position={[-38+Math.sin(angle)*8,5.5,12+Math.cos(angle)*8]} scale={[2,.3,2]}>
        <icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#71945f"/>
      </mesh>;
    })}
  </group>;
}
function LanternPaths(){return <>{Array.from({length:14},(_,i)=>[-1,1].filter(s=>s<0||i!==11).map(s=><group key={`${i}-${s}`} position={[s*14.7,0,-22+i*4]}><Box position={[0,.3,0]} scale={[.6,.6,.6]} color="#a5ac8e"/><Box position={[0,1.2,0]} scale={[.16,1.4,.16]} color="#879678"/><Lantern position={[0,1.95,0]}/><Box position={[0,2.25,0]} scale={[.8,.12,.8]} color="#6d8369"/></group>))}</>}
function Decorations(){return <><Forest/><Bamboo/><LanternPaths/><GardenDetails/><group position={[BODHI.x,BODHI.ground,BODHI.z]}><BodhiTree/></group>
  <CourtyardTrees/>
  {[[12,0,-40],[-13,0,-43],[47,0,-16],[-20,0,34]].map((p,i)=><Tree key={i} position={p as Vec3} scale={1.1}/>)}
  {Array.from({length:12},(_,i)=><mesh key={i} position={[Math.sin(i*2.4)*170,10,-145-Math.abs(Math.cos(i*2.4))*70]} scale={[30,25+i%3*10,25]}><coneGeometry args={[1,1,5]}/><meshStandardMaterial color={i%2?'#8ca188':'#a0af93'} flatShading/></mesh>)}
</>}
function Architecture(){return <><QuanAmShrine/><WaterTaskWorld/><TableAccessories/><AltarOfferings/><ReceptionDesk/><MainTemple/><MeditationHall/><DiningHall/><Library/><Gate/><BellPavilion x={-19}/><BellPavilion x={19} drum/><TeaTerrace/><Stupa/><Decorations/></>}
export default memo(Architecture);
