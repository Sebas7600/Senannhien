import GardenDetails from './GardenDetails';
import {useSurface} from './materials';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { Box, Buddha, Lantern, Roof, Tree } from './models';
import { Food, Steam } from './Food';
import { Character } from './Character';
import { gardenPlots, obstacles, places, seats, WORLD, type Vec3 } from './gameData';
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
function Pavers(){const material=useSurface('stone','#e7dfc8');const ref=useRef<THREE.InstancedMesh>(null);const cells=useMemo(()=>{const a:Vec3[]=[];for(let x=-14;x<=14;x++)for(let z=-17;z<=27;z++)a.push([x,0,z]);for(let x=-47;x<=47;x++)for(const z of [-7,-6,-5,-4,-33,-32])if(Math.abs(x)>14)a.push([x,0,z]);for(let z=-57;z<=47;z++)for(const x of [-18,-17,17,18])if(z<-17||z>27)a.push([x,0,z]);return a},[]);useEffect(()=>{const m=new THREE.Object3D();if(!ref.current)return;cells.forEach((p,i)=>{m.position.set(p[0],.025,p[2]);m.scale.set(.975,.05,.975);m.updateMatrix();ref.current!.setMatrixAt(i,m.matrix);ref.current!.setColorAt(i,new THREE.Color(['#c8c0a5','#cfc7ac','#c2bba0','#d4cbb0'][i%4]))});ref.current.instanceMatrix.needsUpdate=true},[cells]);return <instancedMesh ref={ref} args={[undefined,undefined,cells.length]} receiveShadow material={material}><boxGeometry/></instancedMesh>}
function WalkSurface(){const click=(e:ThreeEvent<MouseEvent>)=>{if(e.delta>5)return;e.stopPropagation();const s=useGame.getState();s.stand();s.set({destination:[e.point.x,e.point.z],pendingSeat:null});};return <mesh position={[0,.065,0]} rotation={[-Math.PI/2,0,0]} onClick={click}><planeGeometry args={[124,132]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>}
export function Ground(){return <group>
  <mesh position={[0,-.15,0]} receiveShadow rotation={[-Math.PI/2,0,0]}><planeGeometry args={[350,350]}/><meshStandardMaterial color="#a6b18a"/></mesh>
  <mesh position={[0,-.04,-2]} receiveShadow><boxGeometry args={[124,.1,132]}/><meshStandardMaterial color="#a4ad83"/></mesh>
  <Pavers/><WalkSurface/>
  {[-1,1].map(s=><group key={s}><Box position={[s*60,.8,-2]} scale={[.35,1.6,128]} color="#b7b89c"/>{Array.from({length:33},(_,i)=><Box key={i} position={[s*60,1.35,-64+i*4]} scale={[.65,2.7,.65]} color="#acb095"/>)}</group>)}
  {[-66,62].map(z=><Box key={z} position={[0,.8,z]} scale={[120,1.6,.35]} color="#b7b89c"/>)}
  <RigidBody type="fixed" colliders={false}>
    <CuboidCollider position={[0,-.24,-2]} args={[62,.3,66]}/>
    <CuboidCollider position={[-60,1,-2]} args={[.3,3,65]}/><CuboidCollider position={[60,1,-2]} args={[.3,3,65]}/><CuboidCollider position={[0,1,-66]} args={[60,3,.3]}/><CuboidCollider position={[0,1,62]} args={[60,3,.3]}/>
    {obstacles.map((o,i)=><CuboidCollider key={i} position={[o.x,o.w>10&&o.d<1?2:.7,o.z]} args={[o.w/2,o.w>10&&o.d<1?2:.7,o.d/2]}/>)}
    <CuboidCollider position={[0,.25,-27]} args={[10.8,.33,9]}/><CuboidCollider position={[0,.17,-17.8]} rotation={[.28,0,0]} args={[4.5,.08,1.8]}/>
    <CuboidCollider position={[-33,.14,-17]} args={[10,.26,8]}/><CuboidCollider position={[-33,.08,-8.6]} rotation={[.2,0,0]} args={[4,.05,1.1]}/>
    <CuboidCollider position={[34,.03,-27]} args={[11.5,.13,9]}/><CuboidCollider position={[-34,.1,-43]} args={[8.5,.25,7]}/>
    <CuboidCollider position={[0,.08,-56]} args={[8,.22,5]}/>
    <CuboidCollider position={[28,.19,4]} args={[11,.2,1.5]}/><CuboidCollider position={[28,.15,39]} args={[13,.2,1.5]}/>
  </RigidBody>
</group>}
function MainTemple(){return <group position={[0,0,-27]}>
  <Box position={[0,.2,0]} scale={[23,.4,19]} color="#b4b398"/><Box position={[0,.49,0]} scale={[21.6,.18,18]} color="#c8bc96"/>
  {[0,1,2].map(i=><Box key={i} position={[0,.08+i*.17,10.2-i*.6]} scale={[9-i*.2,.17,1]} color="#d0c9ab"/>)}
  <Box position={[0,2.8,-8.7]} scale={[21.5,4.5,.22]} color="#d6bd91"/>
  {[-10,-6.7,-3.3,3.3,6.7,10].flatMap(x=>[-8.2,8.2].map(z=><group key={`${x}-${z}`}><Box position={[x,2.9,z]} scale={[.35,4.6,.35]} color="#7c4a35"/><Box position={[x,.8,z]} scale={[.6,.45,.6]} color="#aaa284"/></group>))}
  {[-1,1].map(s=><group key={s}><Box position={[s*10.6,2.4,0]} scale={[.2,3.6,16.5]} color="#c7ab7d"/>{Array.from({length:10},(_,i)=><Box key={i} position={[s*10.4,3.25,-7+i*1.55]} scale={[.03,1.3,.045]} color="#78553a"/>)}</group>)}
  <group position={[0,.6,-5.5]} scale={2}><Buddha/></group>
  <Box position={[0,1,-3.6]} scale={[7.5,.6,1.4]} color="#80503c"/><Box position={[0,1.35,-3.6]} scale={[7.8,.12,1.7]} color="#b49a5d"/>
  {[-3,3].map(x=><group key={x} position={[x,1.45,-3.6]}><mesh><cylinderGeometry args={[.22,.3,.45,16]}/><meshStandardMaterial color="#789080"/></mesh><mesh position={[0,.8,0]}><sphereGeometry args={[.33,12,10]}/><meshStandardMaterial color="#dab7ad"/></mesh></group>)}
  <group position={[0,.8,10.8]}><mesh><cylinderGeometry args={[.65,.45,.7,24]}/><meshStandardMaterial color="#7d8b70" metalness={.3}/></mesh>{[-.18,0,.18].map(x=><mesh key={x} position={[x,.7,0]}><cylinderGeometry args={[.015,.015,.9,6]}/><meshStandardMaterial color="#936b45"/></mesh>)}</group>
  <RoofSection x={0} z={-27} w={23} d={19}><Box position={[0,5,8.4]} scale={[22,.4,.4]} color="#704432"/><Roof y={5.2} width={27} depth={22} height={2.3}/><Box position={[0,7.2,0]} scale={[10,1.5,5]} color="#cdbb92"/><Roof y={8.3} width={14} depth={8} height={1.8}/></RoofSection>
  {[-8,-4,4,8].map(x=><Lantern key={x} position={[x,4.3,8.5]}/>)}
  <WorldLabel position={[0,4.7,9]} title="ĐẠI HÙNG BẢO ĐIỆN" subtitle="Chạm một bồ đoàn để ngồi"/>
</group>}
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
  <Box position={[0,.75,-6.1]} scale={[17,1.25,1.5]} color="#aa9471"/><Box position={[0,1.41,-6.1]} scale={[17.3,.12,1.8]} color="#d3c8a5"/>
  {[-5,-1,3].map(x=><group key={x} position={[x,1.45,-6]}><mesh><cylinderGeometry args={[.5,.43,.38,20]}/><meshStandardMaterial color="#7c8981" metalness={.25}/></mesh><mesh position={[0,.22,0]}><cylinderGeometry args={[.5,.5,.05,20]}/><meshStandardMaterial color="#b7bba4"/></mesh><group position={[0,.25,0]}><Steam/></group></group>)}
  <group position={[7,1.5,-6]} scale={1.5}><Food dish="bread"/></group>
  {[-8.5,8.5].map(x=><group key={x}><Box position={[x,1,-7.6]} scale={[1,1.6,1]} color="#82906c"/><mesh position={[x,2.2,-7.6]} scale={[.6,.8,.6]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#7a975e"/></mesh></group>)}
  {[0,1,2,3].map(i=><group key={i} position={[-4+(i%2)*8,0,-1+Math.floor(i/2)*8]}><Box position={[0,.9,0]} scale={[2.5,.16,3.8]} color="#a38d65"/>{[-1,1].flatMap(s=>[-1,1].map(t=><Box key={`${s}-${t}`} position={[s*.9,.5,t*1.4]} scale={[.13,.85,.13]} color="#7d6747"/>))}<mesh position={[0,1.08,0]}><cylinderGeometry args={[.1,.13,.22,14]}/><meshStandardMaterial color="#9aa77f"/></mesh></group>)}
  <WorldLabel position={[0,1.9,-6]} title="BẾP CHAY" subtitle="Mì · Cơm · Hủ tiếu · Bánh mì"/>
</Pavilion>}
function Library(){return <Pavilion x={-34} z={-43} w={17} d={14} floor={.35} title="TÀNG KINH CÁC" subtitle="Bốn bài thực tập · Chạm kệ sách để đọc">
  {[-6,-2,2,6].map((x,i)=><group key={x} position={[x,0,-5.3]} onClick={e=>{e.stopPropagation();useGame.getState().perform('read')}}>
    <Box position={[0,1.6,0]} scale={[2.7,2.5,.7]} color="#8b6d49"/>{[.7,1.5,2.3].flatMap(y=>Array.from({length:9},(_,j)=><Box key={`${y}-${j}`} position={[-1.05+j*.26,y+.2,.41]} scale={[.18,.53,.2]} color={['#7d8e6c','#ac9570','#7b8f8b','#b99e7d'][(i+j)%4]}/>))}
  </group>)}
  <Box position={[0,.85,0]} scale={[7,.15,1.7]} color="#aa946e"/>{[-2,0,2].map(x=><group key={x}><Box position={[x,.96,0]} scale={[.65,.04,.9]} color="#e0d6b7"/><Box position={[x,.99,0]} scale={[.015,.02,.9]} color="#baa476"/></group>)}
</Pavilion>}
function MeditationHall(){return <Pavilion x={-33} z={-17} w={20} d={16} title="THIỀN ĐƯỜNG TRÚC LÂM" subtitle="20 bồ đoàn · Thiền · Tụng kinh · Gõ mõ">
  <group position={[0,.4,-5.9]} scale={1.4}><Buddha/></group><Box position={[0,1,-5]} scale={[6,.3,.9]} color="#8a6445"/>
  {[-8,8].map(x=><group key={x}><Box position={[x,2.3,-6.5]} scale={[1.2,2.2,.12]} color="#7c7856"/>{[0,1,2].map(i=><mesh key={i} position={[x,3-i*.5,-6.4]}><torusGeometry args={[.13,.015,5,16]}/><meshStandardMaterial color="#d9c59a"/></mesh>)}</group>)}
</Pavilion>}
function Gate(){return <group position={[0,0,29]}>
  {[-7,-2.8,2.8,7].map(x=><group key={x}><Box position={[x,2.3,0]} scale={[.8,4.6,.8]} color="#bbb599"/><Box position={[x,4.6,0]} scale={[1.1,.25,1.1]} color="#7b8b72"/></group>)}
  <RoofSection x={0} z={29} w={18} d={24}><Box position={[0,4.3,0]} scale={[6.1,.75,.7]} color="#657b65"/><Roof y={4.7} width={9} depth={3.5} height={1.4}/>
  {[-5,5].map(x=><group key={x} position={[x,0,0]}><Box position={[0,3.4,0]} scale={[3.8,.5,.5]} color="#76896b"/><Roof y={3.7} width={4.6} depth={2.9} height={.9}/></group>)}
  </RoofSection><WorldLabel position={[0,3.95,.5]} title="SEN AN NHIÊN" subtitle="Chậm một bước · Nhẹ một lòng"/>
</group>}
function BellPavilion({x,drum=false}:{x:number;drum?:boolean}){const bell=useRef<THREE.Group>(null);useFrame(({clock})=>{const e=useGame.getState().event;if(bell.current)bell.current.rotation.z=e?.type==='bell'&&Date.now()-e.at<6000?Math.sin(clock.elapsedTime*5)*.08:0});return <group position={[x,0,-13]}><Box position={[0,.2,0]} scale={[5,.4,5]} color="#b4b598"/>{[-1,1].flatMap(s=>[-1,1].map(t=><Box key={`${s}-${t}`} position={[s*1.8,2.2,t*1.8]} scale={[.25,4,.25]} color="#815538"/>))}<Roof y={4.3} width={6.7} depth={6.5} height={1.6}/><group ref={bell} position={[0,2.6,0]}>{drum?<mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.95,.95,1.3,24]}/><meshStandardMaterial color="#a77c4c"/></mesh>:<><mesh castShadow><cylinderGeometry args={[.55,.9,1.8,24]}/><meshStandardMaterial color="#9aa17a" metalness={.5} roughness={.6}/></mesh><mesh position={[0,-.85,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.88,.07,8,24]}/><meshStandardMaterial color="#b4ae82"/></mesh></>}</group><WorldLabel position={[0,3,2.5]} title={drum?'LẦU TRỐNG':'LẦU CHUÔNG'} subtitle={drum?'Nhịp chậm ngày an':'E · Thỉnh một tiếng chuông'}/></group>}
function Stupa(){return <group position={[-35,0,42]}><Box position={[0,.3,0]} scale={[9,.6,9]} color="#b8b297"/>{Array.from({length:7},(_,i)=><group key={i} position={[0,i*1.85+.6,0]}><Box position={[0,.65,0]} scale={[5.7-i*.5,1.4,5.7-i*.5]} color="#c1ac82"/>{[-1,1].map(s=><Box key={s} position={[0,.73,s*(2.9-i*.25)]} scale={[.55,.85,.05]} color="#726348"/>)}<Roof y={1.3} width={7.4-i*.65} depth={7.4-i*.65} height={.75}/></group>)}<mesh position={[0,14.2,0]}><coneGeometry args={[.35,2,8]}/><meshStandardMaterial color="#c2a268"/></mesh><WorldLabel position={[0,2,5]} title="BẢO THÁP AN LẠC" subtitle="Bảy tầng tĩnh lặng"/></group>}
function TeaTerrace(){return <Pavilion x={0} z={-56} w={16} d={10} floor={.3} title="TRÀ ĐÌNH VỌNG SƠN" subtitle="Ngồi xuống · Uống trà · Ngắm núi">
  {[-3,0,3].map(x=><group key={x}><Box position={[x,.73,1]} scale={[1.9,.12,1.4]} color="#9f8861"/><mesh position={[x,.86,1]}><sphereGeometry args={[.13,12,10]}/><meshStandardMaterial color="#a3b08b"/></mesh><mesh position={[x+.35,.84,1]}><cylinderGeometry args={[.07,.05,.1,10]}/><meshStandardMaterial color="#c6c8ac"/></mesh></group>)}
</Pavilion>}
export function Seats(){const peers=useGame(s=>s.peers),seated=useGame(s=>s.seated);return <>{seats.map(s=><group key={s.id} position={s.position} rotation={[0,s.rotation,0]} onClick={e=>{if(e.delta>5)return;e.stopPropagation();useGame.getState().sit(s.id)}}>
  {s.kind==='cushion'?<><mesh position={[0,.04,0]} receiveShadow><cylinderGeometry args={[.58,.62,.11,24]}/><meshStandardMaterial color={seated===s.id?'#d7ba6b':peers.some(p=>p.seat===s.id)?'#899177':'#b8a36d'} roughness={.95}/></mesh><mesh position={[0,.108,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.42,.45,32]}/><meshStandardMaterial color="#d6c38c"/></mesh></>:<>
    <Box position={[0,-.06,0]} scale={[s.kind==='bench'?1.2:.85,.14,.85]} color="#a49370"/>
    <Box position={[0,.35,-.4]} scale={[s.kind==='bench'?1.2:.85,.7,.09]} color="#9c8b66"/>
    {[-1,1].flatMap(a=>[-1,1].map(b=><Box key={`${a}-${b}`} position={[a*.3,-.28,b*.3]} scale={[.08,.5,.08]} color="#7d7156"/>))}
  </>}
  <mesh position={[0,.03,0]}><cylinderGeometry args={[.73,.73,.08,16]}/><meshBasicMaterial color="#e0c98a" transparent opacity={seated===s.id?.2:0} depthWrite={false}/></mesh>
</group>)}</>}
export function MealPlates(){const meal=useGame(s=>s.meal),peers=useGame(s=>s.peers);const all=[...(meal?[{meal,key:'self'}]:[]),...peers.filter(p=>p.meal).map(p=>({meal:p.meal!,key:p.id}))];return <>{all.filter(o=>o.meal.status==='ready'||o.meal.status==='eating').map(o=>{const seat=seats.find(s=>s.id===o.meal.seatId);if(!seat?.table)return null;const x=seat.position[0]<seat.table[0]?-.65:.65,z=seat.position[2]<seat.table[2]?-.8:.8;return <group key={o.key} position={[seat.table[0]+x,seat.table[1]+.06,seat.table[2]+z]} scale={.85}><Food dish={o.meal.dish} eating={o.meal.status==='eating'}/></group>})}</>}
export function Garden(){const plots=useGame(s=>s.plots),clock=useGame(s=>s.sessionSeconds);return <group><Box position={[36,-.01,-50]} scale={[19,.08,15]} color="#9ea67b"/>{gardenPlots.map(p=>{const state=plots[p.id];const growth=state&&!state.harvested?(state.wateredAt?Math.min(1,(Date.now()-state.wateredAt)/60000):.12):0;return <group key={p.id} position={[p.x,.06,p.z]} onClick={e=>{e.stopPropagation();useGame.getState().garden(p.id)}}><Box scale={[2.5,.15,2.2]} color={state?.wateredAt&&!state.harvested?'#7d7050':'#9f8a61'}/>{[0,1,2,3,4,5].map(i=><group key={i} position={[(i%3-1)*.65,.12,i<3?-.5:.5]}>{growth>0&&[-1,0,1].map(k=><mesh key={k} position={[k*.08,growth*.22,0]} rotation={[0,i,k*.45]} scale={[.12+growth*.2,.06+growth*.22,.12+growth*.17]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={growth>=1?'#6a914d':'#84a95a'}/></mesh>)}</group>)}<NearbyOverlay position={[0,.3,1.25]} maxDistance={20}><button className="plot-tag" onClick={()=>useGame.getState().garden(p.id)}>{!state||state.harvested?'Gieo hạt':!state.wateredAt?'Tưới cây':growth>=1?'Thu hoạch':`${Math.ceil((1-growth)*60)}s`}</button></NearbyOverlay></group>})}<WorldLabel position={[36,2.3,-42]} title="VƯỜN RAU TỪ TÂM" subtitle="Gieo · Tưới · Chờ 60 giây · Thu hoạch"/></group>}
function Forest(){const trunks=useRef<THREE.InstancedMesh>(null),leaves=useRef<THREE.InstancedMesh>(null);const coords=useMemo(()=>{const a:Vec3[]=[];for(let i=0;i<145;i++){const angle=i*2.399,r=64+(i%9)*3;a.push([Math.sin(angle)*r,0,Math.cos(angle)*r-5])}for(let i=0;i<30;i++)a.push([-47+Math.sin(i*2.4)*8,0,-5+i*1.6]);return a},[]);useEffect(()=>{const m=new THREE.Object3D();coords.forEach(([x,y,z],i)=>{const size=.75+i%4*.18;m.position.set(x,2*size,z);m.scale.set(.28*size,4*size,.28*size);m.rotation.set(0,i,0);m.updateMatrix();trunks.current?.setMatrixAt(i,m.matrix);for(let j=0;j<3;j++){m.position.set(x+Math.sin(j*2.4+i)*size,y+(4+j*.5)*size,z+Math.cos(j*2.4+i)*size);m.scale.set(2.5*size,1.5*size,2.3*size);m.updateMatrix();leaves.current?.setMatrixAt(i*3+j,m.matrix);leaves.current?.setColorAt(i*3+j,new THREE.Color(['#517454','#68825a','#84966a'][(i+j)%3]));}});if(trunks.current)trunks.current.instanceMatrix.needsUpdate=true;if(leaves.current)leaves.current.instanceMatrix.needsUpdate=true},[coords]);return <><instancedMesh ref={trunks} args={[undefined,undefined,coords.length]} castShadow><cylinderGeometry args={[1,1.3,1,6]}/><meshStandardMaterial color="#7f7258"/></instancedMesh><instancedMesh ref={leaves} args={[undefined,undefined,coords.length*3]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial roughness={1}/></instancedMesh></>}
function Bamboo(){const ref=useRef<THREE.InstancedMesh>(null);useEffect(()=>{if(!ref.current)return;const m=new THREE.Object3D();for(let i=0;i<80;i++){const a=i*2.399,r=6+(i%9)*.9;m.position.set(-38+Math.sin(a)*r,2.4+(i%3)*.3,12+Math.cos(a)*r);m.scale.set(.06,4.8+(i%3)*.6,.06);m.rotation.set(Math.sin(i)*.04,0,Math.cos(i)*.05);m.updateMatrix();ref.current.setMatrixAt(i,m.matrix);}ref.current.instanceMatrix.needsUpdate=true},[]);return <group><instancedMesh ref={ref} args={[undefined,undefined,80]}><cylinderGeometry args={[1,1,1,6]}/><meshStandardMaterial color="#72885b"/></instancedMesh>{Array.from({length:15},(_,i)=>{const a=i*2.4;return <mesh key={i} position={[-38+Math.sin(a)*8,5.5,12+Math.cos(a)*8]} scale={[2,.3,2]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#71945f"/></mesh>})}</group>}
function LanternPaths(){return <>{Array.from({length:14},(_,i)=>[-1,1].map(s=><group key={`${i}-${s}`} position={[s*14.7,0,-22+i*4]}><Box position={[0,.3,0]} scale={[.6,.6,.6]} color="#a5ac8e"/><Box position={[0,1.2,0]} scale={[.16,1.4,.16]} color="#879678"/><Lantern position={[0,1.95,0]}/><Box position={[0,2.25,0]} scale={[.8,.12,.8]} color="#6d8369"/></group>))}</>}
function Decorations(){return <><Forest/><Bamboo/><LanternPaths/><GardenDetails/><Tree position={[-10,0,0]} scale={1.65} banyan/>
  {[[12,0,-40],[-13,0,-43],[47,0,-16],[-20,0,34],[12,0,19],[-13,0,20]].map((p,i)=><Tree key={i} position={p as Vec3} scale={1.1}/>)}
  {[-1,1].flatMap(s=>[0,8,-8].map(z=><group key={`${s}-${z}`} position={[s*7.2,0,z]}><mesh position={[0,.3,0]}><cylinderGeometry args={[.45,.3,.6,16]}/><meshStandardMaterial color="#7b8e78"/></mesh><mesh position={[0,1.1,0]} scale={[.8,.9,.8]} castShadow><icosahedronGeometry args={[1,2]}/><meshStandardMaterial color="#6e895b"/></mesh></group>))}
  {Array.from({length:12},(_,i)=><mesh key={i} position={[Math.sin(i*2.4)*170,10,-145-Math.abs(Math.cos(i*2.4))*70]} scale={[30,25+i%3*10,25]}><coneGeometry args={[1,1,5]}/><meshStandardMaterial color={i%2?'#8ca188':'#a0af93'} flatShading/></mesh>)}
</>}
function Architecture(){return <><MainTemple/><MeditationHall/><DiningHall/><Library/><Gate/><BellPavilion x={-19}/><BellPavilion x={19} drum/><TeaTerrace/><Stupa/><Decorations/></>}
export default memo(Architecture);



