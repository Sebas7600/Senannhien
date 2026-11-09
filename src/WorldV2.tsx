import PlayerAvatar from './PlayerAvatar';
import {QUAN_AM,nearQuanAm} from './quanAmData';
import {nearWaterWell,nearWaterJar,nearestWaterJar} from './waterTaskData';
import {nearGate} from './courtyardPropsData';
import {toggleTempleGate} from './gateActions';
import FishFood from './FishFood';
import {nearestFeedStation} from './pondLayout';
import {nearestOfferingStation,nearDonationChest} from './templeFixtures';
import {INCENSE_ASH_Y} from './IncenseBurner';
import IncenseSticks from './IncenseSticks';
import { Suspense, memo, useEffect, useMemo, useRef, useState } from 'react';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, Environment, Lightformer } from '@react-three/drei';
import { Physics, RigidBody, CapsuleCollider, CuboidCollider, useRapier, type RapierRigidBody } from '@react-three/rapier';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import Architecture, { Garden, Ground, MealPlates, Seats, NearbyOverlay } from './Environment';
import Waters from './Waters';
import TreeLeaves from './TreeLeaves';
import CourtyardLighting from './CourtyardLighting';
import { Character } from './Character';
import {BODHI,nearBodhiAltar} from './bodhiData';
import {cameraOccluders} from './cameraObstruction';
import PlayerV3, {movementKeys as keys,movementJoystick as joy} from './PlayerV3';
import {playerMotion,performanceStats} from './runtime';
import { useGame,visitDonationChest, floorAt, type Peer } from './gameStore';
import { OFFERING_RANGE, WISH_STATION, incenseSpot, outsideIncenseBurner, INCENSE_RANGE, INCENSE_BURN_MS, distance, gardenPlots, nearestSeat, npcs, seats, usesFloorSeat, RECEPTION_HEADING, type Vec2 } from './gameData';

import { findPath } from './navigation';
import {mealPlan,sampleRoute,servicePhase,serviceLabels,HANDOFF_MS,MEAL_SCALE,createMealPresentation,sampleMealPresentation,sampleKitchenMeal,chefPhase,chefLabels} from './mealService';
import {ServingMeal} from './Food';


function interact(){const s=useGame.getState();if(['incense','flower','candle'].includes(s.action))return;if(nearQuanAm(s.position)){s.perform('incense',QUAN_AM.incenseId);return;}if(nearDonationChest(s.position)){visitDonationChest();return;}const offeringTargets=(['flower','candle'] as const).map(kind=>nearestOfferingStation(kind,s.position,s.offeringFocus)).sort((a,b)=>a.id===s.offeringFocus?-1:b.id===s.offeringFocus?1:distance(s.position,a.spot)-distance(s.position,b.spot));for(const station of offeringTargets)if(distance(s.position,station.spot)<=OFFERING_RANGE){s.perform(station.kind,station.id);return;}if(distance(s.position,incenseSpot)<=INCENSE_RANGE){s.perform('incense');return;}if(nearBodhiAltar(s.position)){s.perform('incense');return;}if(s.seated){s.stand();return;}const waterJar=nearestWaterJar(s.position,s.waterJars);if(s.waterQuest?.phase==='drawing'||s.waterQuest?.phase==='pouring')return;if(s.waterQuest?.phase==='carrying'&&waterJar&&nearWaterJar(s.position,waterJar.id)){s.waterTask(waterJar.id);return;}if(!s.waterQuest&&nearWaterWell(s.position)){s.waterTask();return;}if(nearGate(s.position)){toggleTempleGate();return;}const plot=gardenPlots.filter(p=>distance(s.position,[p.x,p.z])<=3).sort((a,b)=>distance(s.position,[a.x,a.z])-distance(s.position,[b.x,b.z]))[0];if(plot){s.garden(plot.id);return;}const npc=npcs.find(n=>(n.id!=='cook'||!s.meal||servicePhase(s.meal,Date.now())==='idle')&&(n.id!=='chef'||!s.meal||chefPhase(s.meal,Date.now())==='idle')&&Math.hypot(n.x-s.position[0],n.z-s.position[1])<3);if(npc){s.set({npc:npc.id,panel:'dialogue'});return;}const seat=nearestSeat(s.position);if(seat&&distance(s.position,[seat.position[0],seat.position[2]])<2.5){s.sit(seat.id);return;}const p=s.position;if(distance(p,nearestFeedStation(p).spot)<2.5){s.perform('feed');return;}if(distance(p,[-19,-9])<7){s.perform('bell');return;}if(distance(p,WISH_STATION)<10){s.perform('lantern');return;}if(distance(p,[0,-24])<14){s.perform('incense');return;}s.sit();}
function Keyboard(){useEffect(()=>{const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement).matches('input,textarea,select')||e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase(),s=useGame.getState();if(k==='escape'){if(s.panel){s.closePanel();return;}if(s.waterQuest){s.cancelWaterTask();return;}if(s.pendingActivity==='carryWater'){s.stand();return;}if(s.seated)s.stand();else s.set({action:'walk'});return;}if(s.panel||!s.characterConfigured)return;
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','q','c',' '].includes(k)){e.preventDefault();keys.add(k)}
  if(e.repeat)return;if(k==='e')interact();if(k==='m')s.set({panel:'map'});if(k==='b')s.set({panel:'bag'});if(k==='v')s.set({camera:s.camera==='follow'?'overview':'follow'});if(k==='f')s.set({cameraReset:s.cameraReset+1});if(k==='h')s.set({panel:'help'});
};const up=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());const clear=()=>{keys.clear();joy.x=0;joy.y=0};const joystick=(e:Event)=>{Object.assign(joy,(e as CustomEvent).detail)};window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);window.addEventListener('sen-joystick',joystick);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);window.removeEventListener('sen-joystick',joystick)}},[]);return null;}
const malaCameraAngles=[.72,-.72,1.38,-1.38];
function CameraRig(){const controls=useRef<OrbitControlsType>(null);const mode=useGame(s=>s.camera),reset=useGame(s=>s.cameraReset);const lastMode=useRef(''),lastReset=useRef(-1),lastCeremony=useRef(false),followHeight=useRef(1.1);const offset=useRef(new THREE.Vector3());const lastTarget=useRef(new THREE.Vector3(0,1.2,26)),offsetTarget=useRef(new THREE.Vector3()),deltaTarget=useRef(new THREE.Vector3()),ray=useRef(new THREE.Raycaster()),hits=useRef<THREE.Intersection[]>([]),viewDirection=useRef(new THREE.Vector3()),requestedDistance=useRef(11.56),lastDistance=useRef(11.56);
  const lastMalaFocus=useRef(false),beforeMala=useRef(new THREE.Vector3());
  useFrame(({camera},dt)=>{
    if(!controls.current)return;
    const s=useGame.getState(),target=offsetTarget.current;
    const lanternFocus=s.ceremony?.type==='lantern'||s.panel==='lanternMoment';
    const malaFocus=s.action==='beads'&&mode==='follow'&&!lanternFocus;
    if(lanternFocus)target.set(28,4,35.5);
    else if(mode==='overview')target.set(0,1,-2);
    else if(playerMotion.object){
      playerMotion.object.getWorldPosition(target);
      const height=s.seated?(malaFocus?.46:.55):(malaFocus?1.04:1.36);
      followHeight.current=THREE.MathUtils.damp(followHeight.current,height,8,dt);
      target.y+=followHeight.current;
    }else target.set(s.position[0],s.height+1.1,s.position[1]);

    const cameraReset=lastMode.current!==mode||lastReset.current!==reset||lastCeremony.current!==lanternFocus;
    if(cameraReset||lastMalaFocus.current!==malaFocus){
      const heading=playerMotion.object?playerMotion.heading:s.heading;
      const direction=heading+Math.PI;
      offset.current.set(Math.sin(direction)*10,2.2,Math.cos(direction)*10);
      if(mode==='overview')offset.current.set(52,88,100);
      if(lanternFocus)offset.current.set(-11,5.5,13);
      if(malaFocus){
        if(!lastMalaFocus.current){
          if(cameraReset)beforeMala.current.copy(offset.current);
          else beforeMala.current.copy(camera.position).sub(lastTarget.current).setLength(requestedDistance.current);
        }
        for(const angle of malaCameraAngles){
          offset.current.set(Math.sin(heading+angle)*2.55,.48,Math.cos(heading+angle)*2.55);
          ray.current.set(target,viewDirection.current.copy(offset.current).normalize());
          ray.current.near=.35;ray.current.far=offset.current.length()+.24;
          hits.current.length=0;
          ray.current.intersectObjects(cameraOccluders,false,hits.current);
          if(hits.current.length===0)break;
        }
      }else if(lastMalaFocus.current&&!cameraReset){
        offset.current.copy(beforeMala.current);
      }
      camera.position.copy(target).add(offset.current);
      controls.current.target.copy(target);
      lastTarget.current.copy(target);
      lastMode.current=mode;lastReset.current=reset;lastCeremony.current=lanternFocus;lastMalaFocus.current=malaFocus;
      requestedDistance.current=lastDistance.current=offset.current.length();
      controls.current.minDistance=mode==='overview'?35:2.2;
    }
    const delta=deltaTarget.current.copy(target).sub(lastTarget.current);camera.position.add(delta);controls.current.target.copy(target);lastTarget.current.copy(target);
    if(keys.has('q')||keys.has('c')){offset.current.copy(camera.position).sub(target).applyAxisAngle(new THREE.Vector3(0,1,0),(keys.has('q')?1:-1)*dt);camera.position.copy(target).add(offset.current)}
    if(mode==='follow'&&Math.abs(s.position[0])<12.2&&s.position[1]<-19.8&&s.position[1]>-34.3){
      offset.current.copy(camera.position).sub(target);const length=offset.current.length();if(length>6)camera.position.copy(target).add(offset.current.multiplyScalar(6/length));camera.position.y=Math.min(camera.position.y,6.0);
    }
    controls.current.update();
    if(mode!=='overview'&&!lanternFocus){
      const direction=viewDirection.current.copy(camera.position).sub(target),distance=direction.length();direction.normalize();
      requestedDistance.current=THREE.MathUtils.clamp(requestedDistance.current*distance/Math.max(lastDistance.current,.1),2.2,35);
      ray.current.set(target,direction);ray.current.near=.35;ray.current.far=requestedDistance.current;hits.current.length=0;ray.current.intersectObjects(cameraOccluders,false,hits.current);
      const hit=hits.current[0],safe=hit?Math.max(.48,hit.distance-.32):requestedDistance.current;
      const visible=safe<distance?safe:THREE.MathUtils.damp(distance,safe,5,dt);
      camera.position.copy(target).addScaledVector(direction,visible);lastDistance.current=visible;
      controls.current.minDistance=Math.min(2.2,visible);
    }
  },0);
  return <OrbitControls ref={controls} target={[0,1.2,22]} enablePan={false} minDistance={mode==='overview'?35:2.2} maxDistance={mode==='overview'?170:35} minPolarAngle={.25} maxPolarAngle={Math.PI/2.12} enableDamping dampingFactor={.08} mouseButtons={{LEFT:undefined as unknown as THREE.MOUSE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE}} touches={{ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN}}/>;
}
function RemoteAvatar({peer}:{peer:Peer}){
  const [moving,setMoving]=useState(false),movingRef=useRef(false);
  const [safeX,safeZ]=outsideIncenseBurner(peer.x,peer.z);
  const relocated=Math.hypot(safeX-peer.x,safeZ-peer.z)>.001;
  const safeY=relocated?floorAt(safeX,safeZ):peer.y;
  const ref=useRef<THREE.Group>(null),initial=useRef<[number,number,number]>([safeX,safeY,safeZ]),target=useRef(new THREE.Vector3());
  useFrame((_,dt)=>{
    if(!ref.current)return;
    const inMotion=!peer.seat&&Math.hypot(safeX-ref.current.position.x,safeZ-ref.current.position.z)>.12;
    if(inMotion!==movingRef.current){movingRef.current=inMotion;setMoving(inMotion);}
    ref.current.position.lerp(target.current.set(safeX,safeY,safeZ),1-Math.exp(-dt*11));
    // Interpolation can also cross the burner, even with safe endpoints.
    const [x,z]=outsideIncenseBurner(ref.current.position.x,ref.current.position.z);
    if(Math.hypot(x-ref.current.position.x,z-ref.current.position.z)>.001){ref.current.position.set(x,floorAt(x,z),z);}
    const d=THREE.MathUtils.euclideanModulo(peer.heading-ref.current.rotation.y+Math.PI,Math.PI*2)-Math.PI;ref.current.rotation.y+=d*Math.min(1,dt*12);
  });
  return <group ref={ref} position={initial.current}><PlayerAvatar moving={moving} robe={peer.robe} pose={relocated?'walk':peer.action} bowStartedAt={peer.bow?.at} bowMode={peer.bow?.mode} gender={peer.gender} skin={peer.skin} robeStyle={peer.robeStyle} seated={!relocated&&!!peer.seat} dish={peer.meal?.dish} chair={!relocated&&!!peer.seat&&!usesFloorSeat(seats.find(s=>s.id===peer.seat))}/><Html position={[0,1.8,0]} center zIndexRange={[3,0]}><span className="nametag remote"><i/>{peer.name}</span></Html></group>;
}

function Others(){const peers=useGame(s=>s.peers);return <>{peers.map(p=><RemoteAvatar key={p.id} peer={p}/>)}</>}
function Villager({n}:{n:typeof npcs[number]}){
  const ref=useRef<THREE.Group>(null),plate=useRef<THREE.Group>(null),presentation=useRef(createMealPresentation()),serveFrame=useRef(presentation.current.hands),meal=useGame(s=>n.id==='cook'||n.id==='chef'?s.meal:null),plan=useMemo(()=>meal&&n.id==='cook'?mealPlan(meal.seatId):null,[meal?.seatId,n.id]);
  const [motion,setMotion]=useState({walking:false,carrying:false,cooking:false,label:'Trò chuyện · E'}),lastMotion=useRef(''),sample=useRef({x:n.x as number,y:0,z:n.z as number,heading:0});
  useFrame((_,dt)=>{if(!ref.current)return;const out=sample.current;out.x=n.x;out.z=n.z;out.heading=RECEPTION_HEADING;
    let walking=false,carrying=false,cooking=false,label='Trò chuyện · E';
    if(meal&&n.id==='chef'){
      const k=sampleKitchenMeal(meal,Date.now(),presentation.current).kitchen;out.x=k.x;out.z=k.z;out.heading=k.heading;walking=k.walking;carrying=k.carrying;cooking=k.phase==='cooking';label=chefLabels[k.phase];
    }else if(meal&&plan&&meal.orderedAt!==undefined&&meal.deliveryAt!==undefined&&meal.kitchenAt!==undefined){
      const now=Date.now(),phase=servicePhase(meal,now);label=phase==='idle'?'Trò chuyện · E':serviceLabels[phase];
      if(phase==='toKitchen'){sampleRoute(plan.toKitchen,(now-meal.orderedAt)/Math.max(1,meal.kitchenAt-meal.orderedAt),out);walking=true;}
      else if(phase==='waiting'||phase==='pickup'){sampleRoute(plan.toKitchen,1,out);out.heading=-Math.PI/2;carrying=phase==='pickup';}
      else if(phase==='delivering'||phase==='handoff'){sampleRoute(plan.toTable,(now-meal.deliveryAt)/Math.max(1,meal.readyAt-HANDOFF_MS-meal.deliveryAt),out);if(phase==='handoff')out.heading=plan.heading;walking=phase==='delivering';carrying=true;}
      else if(phase==='returning'){sampleRoute(plan.toReception,(now-meal.readyAt)/Math.max(1,(meal.homeAt??now)-meal.readyAt),out);walking=true;}
    }
    out.y=floorAt(out.x,out.z);ref.current.position.set(out.x,out.y,out.z);
    const turn=THREE.MathUtils.euclideanModulo(out.heading-ref.current.rotation.y+Math.PI,Math.PI*2)-Math.PI;if(n.id==='chef')ref.current.rotation.y=out.heading;else ref.current.rotation.y+=turn*(1-Math.exp(-Math.min(dt,.05)*12));
    if(meal&&plate.current){
      out.heading=ref.current.rotation.y;const p=sampleMealPresentation(meal,Date.now(),out,presentation.current),dx=p.position[0]-out.x,dz=p.position[2]-out.z,sin=Math.sin(out.heading),cos=Math.cos(out.heading);
      plate.current.visible=p.visible;plate.current.position.set(dx*cos-dz*sin,p.position[1]-out.y,dx*sin+dz*cos);plate.current.rotation.y=p.heading-out.heading;
    }
    const key=`${walking}-${carrying}-${cooking}-${label}`;if(key!==lastMotion.current){lastMotion.current=key;setMotion({walking,carrying,cooking,label})}
  },-1);
  const talk=()=>{const s=useGame.getState(),p=ref.current?.position;if(!p)return;if(motion.label!=='Trò chuyện · E'){s.notify(`${n.name} đang chuẩn bị và phục vụ món, mời bạn chọn ghế rồi gọi món tại bàn nhé.`);return;}if(distance(s.position,[p.x,p.z])>4){s.stand();s.set({destination:[p.x,p.z+1.2]});s.notify(`Đến gần ${n.name} để trò chuyện.`)}else s.set({npc:n.id,panel:'dialogue'})};
  return <group ref={ref} position={[n.x,floorAt(n.x,n.z),n.z]} onClick={e=>{e.stopPropagation();talk()}}>
    <Character robe={n.robe} gender={n.id==='cook'||n.id==='chef'?'female':'male'} apron={n.id==='chef'} dish={meal?.dish} moving={motion.walking} pose={motion.cooking?'cook':motion.carrying?'serve':'walk'} serveFrame={n.id==='cook'||n.id==='chef'?serveFrame:undefined}/>
    {meal&&n.id==='cook'&&<group ref={plate} visible={false} scale={MEAL_SCALE} onClick={e=>{e.stopPropagation();const s=useGame.getState();if(s.meal?.status==='ready')s.eat();}}><ServingMeal dish={meal.dish} eating={meal.status==='eating'}/></group>}
    <NearbyOverlay position={[0,n.id==='chef'?2.75:1.9,0]} maxDistance={18}><button className="npc-tag" onClick={talk}>{n.name}<span>{motion.label}</span></button></NearbyOverlay>
  </group>
}
function Villagers(){return <>{npcs.map(n=><Villager key={n.id} n={n}/>)}</>}

function OfferingEffects(){const allBurning=useGame(s=>s.burningIncense),slots=useGame(s=>s.offeringSlots),burning=allBurning.filter(at=>slots[at]!==QUAN_AM.incenseId);useGame(s=>s.sessionSeconds);const active=burning.filter(at=>Date.now()-at<INCENSE_BURN_MS);const ref=useRef<THREE.Group>(null);useFrame(({clock})=>ref.current?.children.forEach((m,i)=>{const t=(clock.elapsedTime*.2+i*.17)%1;m.position.set(Math.sin(t*8+i)*.18,.4+t*1.5,0);m.scale.setScalar(.03+t*.07)}));return <group>
  {burning.length>0&&<IncenseSticks times={burning} heightScale={.85} thicknessScale={.75}/>}
  {active.length>0&&<group position={[incenseSpot[0],INCENSE_ASH_Y,incenseSpot[1]]} ref={ref}>{Array.from({length:8},(_,i)=><mesh key={i}><sphereGeometry args={[1,6,6]}/><meshBasicMaterial transparent opacity={.15} color="#ede8d0" depthWrite={false}/></mesh>)}</group>}
  <FishFood/>
</group>}
function FrameMetrics(){const samples=useRef<number[]>([]),elapsed=useRef(0);useFrame((_,dt)=>{samples.current.push(dt*1000);elapsed.current+=dt;if(elapsed.current>=2){const sorted=samples.current.slice().sort((a,b)=>a-b);performanceStats.fps=Math.round(samples.current.length/elapsed.current);performanceStats.p95=Math.round(sorted[Math.floor(sorted.length*.95)]||0);performanceStats.frames+=samples.current.length;document.documentElement.dataset.performance=JSON.stringify(performanceStats);samples.current=[];elapsed.current=0}});return null;}
function SceneReady(){useEffect(()=>{document.documentElement.dataset.scene='ready';return()=>{delete document.documentElement.dataset.scene}},[]);return null;}
function WorldV2(){const quality=useGame(s=>s.quality);return <Canvas shadows={quality==='high'} dpr={quality==='high'?[1,1.3]:1} gl={{antialias:quality==='high',powerPreference:quality==='low'?'low-power':'high-performance'}} camera={{position:[0,6.8,36],fov:48}}>
  <Environment frames={1} resolution={quality==='low'?64:128}><Lightformer intensity={1.2} position={[0,10,0]} rotation={[Math.PI/2,0,0]} scale={[30,30,1]}/><Lightformer intensity={.7} color="#e6efff" position={[10,4,0]} rotation={[0,Math.PI/2,0]} scale={[20,20,1]}/></Environment><FrameMetrics/><CourtyardLighting/><PerspectiveCamera makeDefault position={[0,6.8,36]} fov={48} near={.1} far={280}/><CameraRig/><Keyboard/>
  <Suspense fallback={<Html center><div className="scene-loading"><span className="loading-lotus">❋</span>Đang mở khuôn viên an nhiên…</div></Html>}>
    <Physics gravity={[0,-9.81,0]} timeStep={1/60} interpolate updatePriority={-50}><Ground/><Architecture/><Waters/><Seats/><Garden/><PlayerV3/><Others/><Villagers/><TreeLeaves/><MealPlates/><OfferingEffects/><SceneReady/></Physics>
  </Suspense>
</Canvas>}
export default memo(WorldV2);
