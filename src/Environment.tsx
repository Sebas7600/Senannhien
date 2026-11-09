import HallIncense from './HallIncense';
import CourtyardCollision from './CourtyardCollision';
import BambooGrove from './BambooGrove';
import GravelPaths from './GravelPaths';
import {bambooEntrances} from './mayaPaths';
import {BAMBOO_PAVILION,BAMBOO_PAVILION_STEP,BAMBOO_BENCH_HEIGHT,bambooPavilionBenches} from './bambooPavilionLayout';
import {bambooZoneBounds} from './courtyardZoneData';
import ChanhDienRoof from './ChanhDienRoof';
import {MAYA_LEVEL} from './mayaLevel';
import {BRIDGE_ROAD,pondContains} from './pondLayout';
import {outerGroundGeometry,courtyardGroundGeometry,bambooGroundGeometry} from './outdoorGroundGeometry';
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
import {finishInstanceLayout} from './geometryBatch';
import {BODHI} from './bodhiData';
import BenchBatches from './BenchBatches';
import CushionBatches from './CushionBatches';
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {CourtyardZoneDecor,CourtyardZoneGround} from './CourtyardZones';
import {GATE,gateAvenueTrees} from './courtyardPropsData';
import PathLamps from './PathLamps';
import {woodlandBarkGeometries} from './treeBranches';
import {useOutdoorSurface,useSurface} from './materials';
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
  const screenLabel=typeof window!=='undefined'&&(window.matchMedia?.('(pointer:coarse)')?.matches||window.innerWidth<=760);
  return <group ref={ref} position={position}>{shown&&<Html center distanceFactor={screenLabel?undefined:distanceFactor} zIndexRange={[3,0]}>{children}</Html>}</group>;
}function RoofSection({x,z,w,d,children}:{x:number;z:number;w:number;d:number;children:React.ReactNode}){const ref=useRef<THREE.Group>(null);useFrame(()=>{if(!ref.current)return;const s=useGame.getState();ref.current.visible=!(Math.abs(s.position[0]-x)<w/2+1&&Math.abs(s.position[1]-z)<d/2+2)});return <group ref={ref}>{children}</group>}
const pavedCells=new Map<string,[number,number]>();
function paveStrip(minX:number,maxX:number,minZ:number,maxZ:number){
  for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){
    if(!pondContains(x,z,.65))pavedCells.set(`${x},${z}`,[x,z]);
  }
}
paveStrip(-3,3,-17,GATE.z+10);
paveStrip(-47,BRIDGE_ROAD.x+1,-7,-4);
paveStrip(BRIDGE_ROAD.x-1,BRIDGE_ROAD.x+1,BRIDGE_ROAD.northZ,BRIDGE_ROAD.southZ);
paveStrip(-18,18,26,27);
paveStrip(-47,-15,-33,-32);
paveStrip(15,47,-33,-32);
paveStrip(-18,-17,-57,47);
paveStrip(17,18,-57,47);
const paverGeometry=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
const borderGeometry=paverGeometry.clone();
const borderUV=borderGeometry.getAttribute('uv');
for(let i=0;i<borderUV.count;i++)borderUV.setXY(i,borderUV.getX(i)*.5,borderUV.getY(i)*.25);
const trimWidth=.17;
const borderSegments:{x:number;z:number;length:number;angle:number}[]=[];
function addPaverBorder(x:number,z:number,length:number,angle:number){
  const vertical=angle!==0;
  const fixed=vertical?x:z,center=vertical?z:x;
  const start=center-length/2,end=center+length/2;
  const opening=bambooEntrances.find(entry=>entry.axis===(vertical?'x':'z')&&Math.abs(fixed-entry.edge)<=trimWidth);
  const ranges=opening?[[start,Math.min(end,opening.from)],[Math.max(start,opening.to),end]]:[[start,end]];
  for(const [from,to] of ranges){
    if(to<=from)continue;
    const mid=(from+to)/2;
    borderSegments.push({x:vertical?x:mid,z:vertical?mid:z,length:to-from,angle});
  }
}
const isPaved=(x:number,z:number)=>pavedCells.has(`${x},${z}`);
for(const [x,z] of pavedCells.values()){
  const left=!isPaved(x-1,z),right=!isPaved(x+1,z);
  if(left)addPaverBorder(x-.5+trimWidth/2,z,1,Math.PI/2);
  if(right)addPaverBorder(x+.5-trimWidth/2,z,1,Math.PI/2);
  const length=1-(Number(left)+Number(right))*trimWidth;
  const center=x+(Number(left)-Number(right))*trimWidth/2;
  if(!isPaved(x,z-1))addPaverBorder(center,z-.5+trimWidth/2,length,0);
  if(!isPaved(x,z+1))addPaverBorder(center,z+.5-trimWidth/2,length,0);
}

function Pavers(){
  const material=useOutdoorSurface('herringbone'),trimMaterial=useOutdoorSurface('brick-edge');
  const ref=useRef<THREE.InstancedMesh>(null),border=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const mesh=ref.current!,edge=border.current!,pose=new THREE.Object3D();
    let index=0;
    for(const [x,z] of pavedCells.values())mesh.setMatrixAt(index++,pose.matrix.makeTranslation(x,.05,z));
    borderSegments.forEach(({x,z,length,angle},i)=>{
      pose.position.set(x,.057,z);
      pose.rotation.set(0,angle,0);
      pose.scale.set(length,1,trimWidth);
      pose.updateMatrix();
      edge.setMatrixAt(i,pose.matrix);
    });
    for(const batch of [mesh,edge]){
      batch.instanceMatrix.needsUpdate=true;
      batch.computeBoundingSphere();
    }
  },[]);
  return <group dispose={null}>
    <instancedMesh ref={ref} args={[paverGeometry,material,pavedCells.size]} receiveShadow/>
    <instancedMesh ref={border} args={[borderGeometry,trimMaterial,borderSegments.length]} receiveShadow/>
  </group>;
}
function WalkSurface(){const click=(e:ThreeEvent<MouseEvent>)=>{if(e.delta>5)return;e.stopPropagation();const s=useGame.getState();s.stand();s.set({destination:[e.point.x,e.point.z],pendingSeat:null});};return <mesh position={[0,.065,0]} rotation={[-Math.PI/2,0,0]} onClick={click}><planeGeometry args={[124,132]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
export function Ground(){const night=useGame(s=>s.night),soil=useOutdoorSurface('bamboo-soil'),stone=useOutdoorSurface('flagstone');return <group><IncenseBurner/>
  <mesh position={[0,-.15,0]} geometry={outerGroundGeometry} receiveShadow dispose={null}><meshStandardMaterial color={night?'#4b596a':'#a6b18a'}/></mesh>
  <mesh position={[0,.01,0]} geometry={courtyardGroundGeometry} material={stone} receiveShadow dispose={null}/>
  <mesh position={[0,.01,0]} geometry={bambooGroundGeometry} material={soil} receiveShadow dispose={null}/>
  <CourtyardZoneGround/>
  <Pavers/><GravelPaths/><CourtyardDapple/><WalkSurface/>
  {[-1,1].map(s=><group key={s}><Box position={[s*60,.8,5]} scale={[.35,1.6,142]} color="#b7b89c"/>{Array.from({length:36},(_,i)=><Box key={i} position={[s*60,1.35,-64+i*4]} scale={[.65,2.7,.65]} color="#acb095"/>)}</group>)}
  {[-66,76].map(z=><Box key={z} position={[0,.8,z]} scale={[120,1.6,.35]} color="#b7b89c"/>)}
  <CourtyardCollision/><RigidBody type="fixed" colliders={false} userData={{cameraWall:true}}>
    <CuboidCollider position={[-60,1,5]} args={[.3,3,72]}/><CuboidCollider position={[60,1,5]} args={[.3,3,72]}/><CuboidCollider position={[0,1,-66]} args={[60,3,.3]}/><CuboidCollider position={[0,1,76]} args={[60,3,.3]}/>
{obstacles.filter(o=>o.cameraWall&&!o.navigationOnly).map((o,i)=>{const h=o.height??4.3;return <CuboidCollider key={i} position={[o.x,(o.base??0)+h/2,o.z]} args={[o.w/2,h/2,o.d/2]}/>})}</RigidBody><RigidBody type="fixed" colliders={false}>
    <CuboidCollider position={[0,-.24,5]} args={[62,.3,73]}/>

    {obstacles.filter(o=>!o.navigationOnly&&!o.cameraWall).map((o,i)=>{const h=o.height??1.4;return <CuboidCollider key={i} position={[o.x,(o.base??0)+h/2,o.z]} args={[o.w/2,h/2,o.d/2]}/>})}
    {floorSurfaces.map((f,i)=><CuboidCollider key={`floor-${i}`} position={[f.x,f.height/2,f.z]} args={[f.w/2,f.height/2,f.d/2]}/>)}

  </RigidBody>
</group>}
function MainTemple(){return <MainTempleReference/>}

function Pavilion({x,z,w,d,title,subtitle,children,floor=.4}:{x:number;z:number;w:number;d:number;title:string;subtitle:string;children:React.ReactNode;floor?:number}){return <group position={[x,0,z]}>
  <Box position={[0,floor/2,0]} scale={[w,floor,d]} color="#b3aa8b"/>
  <Box position={[0,2.3,-d/2+.15]} scale={[w,4,.2]} color="#ceba94"/>
  {[-1,1].flatMap(s=>[-1,0,1].map(i=><Box key={`${s}-${i}`} position={[s*(w/2-.4),2.3,i*(d/2-.5)]} scale={[.3,4.2,.3]} color="#81583b"/>))}
  <RoofSection x={x} z={z} w={w} d={d}><ChanhDienRoof y={4.45} width={w+3} depth={d+3}/><Box position={[0,4.3,d/2-.2]} scale={[w,.32,.3]} color="#7a5238"/></RoofSection>
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
function BambooPavilion(){
  const {x,z,w,d,height}=BAMBOO_PAVILION;
  const step=BAMBOO_PAVILION_STEP;
  return <>
    <Box position={[step.x,step.height/2,step.z]} scale={[step.w,step.height,step.d]} color="#b3aa8b"/>
    <Pavilion x={x} z={z} w={w} d={d} floor={height} title="CHÒI RỪNG TRÚC" subtitle="Bấm vào ghế để ngồi nghỉ">
      {bambooPavilionBenches.map((bench,i)=><group key={i} position={[bench.x-x,height,bench.z-z]} onClick={event=>{
        if(event.delta>5)return;
        event.stopPropagation();
        const state=useGame.getState(),side=event.point.x<bench.x?0:1;
        const preferred=`bamboo-chòi-${i}-${side}`;
        state.sit(state.peers.some(peer=>peer.seat===preferred)?`bamboo-chòi-${i}-${1-side}`:preferred);
      }}>
        <Box position={[0,BAMBOO_BENCH_HEIGHT-.06,0]} scale={[1.82,.12,.59]} color="#986e47"/>
        <Box position={[0,.69,-.25]} scale={[1.82,.28,.10]} color="#815635"/>
        {[-.70,.70].map(dx=><Box key={dx} position={[dx,.26,-.055]} scale={[.12,.52,.44]} color="#714c32"/>)}
      </group>)}
    </Pavilion>
  </>;
}
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
  return <group position={[x,0,-13]} onClick={e=>{if(e.delta>5)return;e.stopPropagation();useGame.getState().perform(drum?'drum':'bell')}}>
    <Box position={[0,.2,0]} scale={[5,.4,5]} color="#b4b598"/>
    {[-1,1].flatMap(s=>[-1,1].map(t=><Box key={`${s}-${t}`} position={[s*1.8,2.2,t*1.8]} scale={[.25,4,.25]} color="#815538"/>))}
    <RoofSection x={x} z={-13} w={5} d={5}><ChanhDienRoof y={4.15} width={6.7} depth={6.5}/></RoofSection>
    {drum?<ImportedDrum/>:<ImportedBell/>}
    <WorldLabel position={[0,3,2.5]} title={drum?'LẦU TRỐNG':'LẦU CHUÔNG'} subtitle={drum?'E · Đánh ba tiếng trống':'E · Thỉnh một tiếng chuông'}/>
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
  const broad=useRef<THREE.InstancedMesh>(null),upright=useRef<THREE.InstancedMesh>(null),leaves=useRef<THREE.InstancedMesh>(null);
  const bark=useOutdoorSurface('bark');
  const coords=useMemo(()=>{
    const positions:Vec3[]=[];
    for(let i=0;i<145;i++){
      const angle=i*2.399,radius=64+(i%9)*3;
      positions.push([Math.sin(angle)*radius,0,Math.cos(angle)*radius-5]);
    }
    for(let i=0;i<30;i++)positions.push([-47+Math.sin(i*2.4)*8,0,-5+i*1.6]);
    const [west,east,north,south]=bambooZoneBounds;
    return positions.filter(([x,,z])=>Math.hypot(x-GATE.x,z-GATE.z)>12&&
      (x<west-2.7||x>east+2.7||z<north-2.7||z>south+2.7));
  },[]);
  useLayoutEffect(()=>{
    const trunkBatches=[broad.current!,upright.current!],crown=leaves.current!,pose=new THREE.Object3D();
    const shades=['#517454','#68825a','#84966a'].map(color=>new THREE.Color(color));
    coords.forEach(([x,y,z],i)=>{
      const size=.75+i%4*.18,variant=i%2;
      const width=size*(variant ? .79 : 1.04),height=size*(variant ? 1.13 : 1);
      pose.position.set(x,y,z);
      pose.scale.set(width,height,width);
      pose.rotation.set(0,i*2.399,0);
      pose.updateMatrix();
      trunkBatches[variant].setMatrixAt(Math.floor(i/2),pose.matrix);
      for(let j=0;j<5;j++){
        const angle=j*2.399+i,radius=(j<3?1.08:.75)*width;
        const crownSize=(j<3?1.80:1.0)*width;
        pose.position.set(x+Math.sin(angle)*radius,y+(3.68+j*.36)*height,z+Math.cos(angle)*radius);
        pose.scale.set(crownSize,(j<3?1.15:.78)*height,crownSize*.9);
        pose.rotation.set(.12*Math.sin(i+j),angle,.13*Math.cos(j));
        pose.updateMatrix();
        crown.setMatrixAt(i*5+j,pose.matrix);
        crown.setColorAt(i*5+j,shades[(i+j)%3]);
      }
    });
    for(const mesh of [...trunkBatches,crown]){
      mesh.instanceMatrix.needsUpdate=true;
      mesh.computeBoundingSphere();
    }
    if(crown.instanceColor)crown.instanceColor.needsUpdate=true;
  },[coords]);
  return <group dispose={null}>
    <instancedMesh ref={broad} args={[woodlandBarkGeometries[0],bark,Math.ceil(coords.length/2)]} castShadow/>
    <instancedMesh ref={upright} args={[woodlandBarkGeometries[1],bark,Math.floor(coords.length/2)]} castShadow/>
    <instancedMesh ref={leaves} args={[undefined,undefined,coords.length*5]} castShadow>
      <icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={1}/>
    </instancedMesh>
  </group>;
}
function Decorations(){return <><Forest/><BambooGrove/><PathLamps/><GardenDetails/><group position={[BODHI.x,BODHI.ground,BODHI.z]}><BodhiTree/></group>
  <group position={[MAYA_LEVEL.extraBodhi.x,BODHI.ground,MAYA_LEVEL.extraBodhi.z]}><BodhiTree interactive={false}/></group>
  <CourtyardTrees/>
  {gateAvenueTrees.map(({x,z,scale})=><Tree key={`${x}-${z}`} position={[x,.06,z]} scale={scale}/>)}
  {[[12,0,-40],[-13,0,-43],[47,0,-16],[-20,0,34]].map((p,i)=><Tree key={i} position={p as Vec3} scale={1.1}/>)}
  {Array.from({length:12},(_,i)=><mesh key={i} position={[Math.sin(i*2.4)*170,10,-145-Math.abs(Math.cos(i*2.4))*70]} scale={[30,25+i%3*10,25]}><coneGeometry args={[1,1,5]}/><meshStandardMaterial color={i%2?'#8ca188':'#a0af93'} flatShading/></mesh>)}
</>}
function Architecture(){return <><QuanAmShrine/><WaterTaskWorld/><TableAccessories/><AltarOfferings/><HallIncense/><ReceptionDesk/><MainTemple/><MeditationHall/><DiningHall/><Library/><Gate/><BellPavilion x={MAYA_LEVEL.bellX}/><BellPavilion x={MAYA_LEVEL.drumX} drum/><TeaTerrace/><Stupa/><BambooPavilion/><Decorations/><CourtyardZoneDecor/></>}
export default memo(Architecture);
