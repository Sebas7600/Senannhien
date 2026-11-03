import {useEffect,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import {RigidBody,CapsuleCollider,useBeforePhysicsStep,useRapier,type RapierRigidBody,type RapierCollider} from '@react-three/rapier';
import * as THREE from 'three';
import {useGame,floorAt} from './gameStore';
import {seats,type Vec2} from './gameData';
import {findPath} from './navigation';
import {Character} from './Character';
import {playerMotion} from './runtime';
export const movementKeys=new Set<string>();
export const movementJoystick={x:0,y:0};
export default function PlayerV3(){
  const body=useRef<RapierRigidBody>(null),collider=useRef<RapierCollider>(null),renderObject=useRef<THREE.Group>(null),visual=useRef<THREE.Group>(null),{world}=useRapier(),camera=useThree(s=>s.camera);
  const controller=useRef<ReturnType<typeof world.createCharacterController>|null>(null),path=useRef<Vec2[]>([]),destinationKey=useRef(''),lastTeleport=useRef(0),sync=useRef(0),seconds=useRef(0),movingRef=useRef(false),forward=useRef(new THREE.Vector3());
  const[moving,setMoving]=useState(false);const pose=useGame(s=>s.action),robe=useGame(s=>s.robe),name=useGame(s=>s.name),seated=useGame(s=>s.seated),gender=useGame(s=>s.gender),skin=useGame(s=>s.skin),robeStyle=useGame(s=>s.robeStyle),bow=useGame(s=>s.bow);
  useEffect(()=>{const c=world.createCharacterController(.02);c.enableAutostep(.7,.15,true);c.enableSnapToGround(.8);c.setApplyImpulsesToDynamicBodies(true);c.setCharacterMass(1);controller.current=c;playerMotion.object=renderObject.current;playerMotion.heading=Math.PI;return()=>{world.removeCharacterController(c);controller.current=null;playerMotion.object=null;movementKeys.clear();movementJoystick.x=movementJoystick.y=0}},[world]);
  useFrame(()=>{if(visual.current)visual.current.rotation.y=playerMotion.heading});
  useBeforePhysicsStep(()=>{
    const rb=body.current,c=controller.current;if(!rb||!c||!collider.current)return;const dt=1/60,s=useGame.getState();let p=rb.translation();
    if(s.teleport&&s.teleport.at!==lastTeleport.current){lastTeleport.current=s.teleport.at;const t=s.teleport.position;rb.setTranslation({x:t[0],y:t[1]+.68,z:t[2]},true);rb.setNextKinematicTranslation({x:t[0],y:t[1]+.68,z:t[2]});playerMotion.heading=s.teleport.heading;s.set({position:[t[0],t[2]],height:t[1],heading:s.teleport.heading});return;}
    let dx=(movementKeys.has('d')||movementKeys.has('arrowright')?1:0)-(movementKeys.has('a')||movementKeys.has('arrowleft')?1:0)+movementJoystick.x;
    let dz=(movementKeys.has('s')||movementKeys.has('arrowdown')?1:0)-(movementKeys.has('w')||movementKeys.has('arrowup')?1:0)+movementJoystick.y;
    if(s.panel||!s.characterConfigured||!s.started){dx=dz=0;}
    let walking=false;
    if(s.seated){if(dx||dz){s.stand();return;}const seat=seats.find(c=>c.id===s.seated)!;rb.setNextKinematicTranslation({x:seat.position[0],y:seat.position[1]+.68,z:seat.position[2]});playerMotion.heading=seat.rotation;}
    else{
      let vx=0,vz=0;
      if(dx||dz){camera.getWorldDirection(forward.current);forward.current.y=0;forward.current.normalize();const f=forward.current;vx=-f.z*dx-f.x*dz;vz=f.x*dx-f.z*dz;if(s.destination||s.pendingSeat)s.set({destination:null,pendingSeat:null});if(s.action!=='walk'&&s.action!=='sweep')s.set({action:'walk',bow:null});path.current=[];destinationKey.current='';}
      else if(s.destination&&!s.panel&&s.characterConfigured){const key=s.destination.join(',');if(key!==destinationKey.current){destinationKey.current=key;path.current=findPath([p.x,p.z],s.destination);if(!path.current.length){s.set({destination:null,pendingSeat:null});s.notify('Chọn một điểm có lối đi nhé.')}}
        const next=path.current[0];if(next){vx=next[0]-p.x;vz=next[1]-p.z;if(Math.hypot(vx,vz)<.23){path.current.shift();if(!path.current.length){s.set({destination:null});destinationKey.current='';if(s.pendingSeat){const seat=seats.find(t=>t.id===s.pendingSeat)!;if(s.peers.some(t=>t.seat===seat.id)){s.set({pendingSeat:null});s.notify('Chỗ này đang có người ngồi.')}else{s.set({seated:seat.id,pendingSeat:null,action:s.pendingAction,position:[seat.position[0],seat.position[2]],height:seat.position[1],heading:seat.rotation,panel:seat.kind==='dining'&&(!s.meal||s.meal.status==='finished')?'menu':null})}return;}}}}
      }
      const length=Math.hypot(vx,vz);walking=length>.05;const speed=s.action==='sweep'?2.9:movementKeys.has('shift')?7.3:s.destination?5.2:4.3;
      const mx=length?vx/length*speed*dt:0,mz=length?vz/length*speed*dt:0,desiredFloor=floorAt(p.x+mx,p.z+mz)+.70;
      // Only step up at an actual height change; do not teleport 1 cm on every frame.
      if(desiredFloor-p.y>.08&&desiredFloor-p.y<.8){rb.setTranslation({x:p.x,y:desiredFloor+.015,z:p.z},true);p=rb.translation();}
      c.computeColliderMovement(collider.current,{x:mx,y:-.035,z:mz});const d=c.computedMovement();rb.setNextKinematicTranslation({x:p.x+d.x,y:Math.max(p.y+d.y,floorAt(p.x+d.x,p.z+d.z)+.70),z:p.z+d.z});
      if(walking){const target=Math.atan2(vx,vz),diff=THREE.MathUtils.euclideanModulo(target-playerMotion.heading+Math.PI,Math.PI*2)-Math.PI;playerMotion.heading+=diff*Math.min(1,12*dt);}
      sync.current+=dt;if(sync.current>=.125){sync.current=0;if(Math.hypot(p.x-s.position[0],p.z-s.position[1])>.002||Math.abs(playerMotion.heading-s.heading)>.01||Math.abs(p.y-.68-s.height)>.015)s.set({position:[p.x,p.z],height:p.y-.68,heading:playerMotion.heading})}
    }
    playerMotion.moving=walking;if(walking!==movingRef.current){movingRef.current=walking;setMoving(walking)}
    seconds.current+=dt;if(seconds.current>=1){seconds.current=0;if(document.visibilityState==='visible'&&s.characterConfigured){s.tick();if(!s.panel&&['meditate','pray','beads','chant','mok'].includes(s.action)&&(!walking||s.seated))s.record(s.action as 'meditate');if(walking){s.record('walk');s.set({energy:Math.max(0,s.energy-.025)})}}}
    if(s.action==='bow')s.finishBow();
  });
  const seat=seats.find(s=>s.id===seated);return <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[0,.76,22]} enabledRotations={[false,false,false]}><CapsuleCollider ref={collider} args={[.4,.28]}/><group ref={renderObject} position={[0,-.68,0]}><group ref={visual}><Character robe={robe} pose={pose} moving={moving} seated={!!seated} chair={!!seat&&seat.kind!=='cushion'} gender={gender} skin={skin} robeStyle={robeStyle} bowStartedAt={bow?.at} bowMode={bow?.mode}/></group><Html position={[0,seated?(seat?.kind==='cushion'?1.4:1.1):1.95,0]} center zIndexRange={[4,0]}><span className="nametag"><i/>{name}</span></Html></group></RigidBody>;
}

