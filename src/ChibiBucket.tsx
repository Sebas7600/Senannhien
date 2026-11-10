import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {wellBucketGeometry,bucketMaterial,waterDiscGeometry,waterMaterial} from './waterTaskGeometry';
import type {ChibiWaterFrame} from './chibiWaterMotion';
import {WATER_JARS} from './waterTaskData';
import {useGame} from './gameStore';
const streamGeometry=new T.CylinderGeometry(.012,.008,1,5),streamMaterial=new T.MeshBasicMaterial({color:'#8bb8b0'});
function streamPoint(t:number,out:T.Vector3,start:T.Vector3,control:T.Vector3,end:T.Vector3){return out.copy(start).multiplyScalar((1-t)**2).addScaledVector(control,2*(1-t)*t).addScaledVector(end,t*t);}
/** Reuses the existing well bucket; the garden watering can is a separate prop. */
export default function ChibiBucket({frame,localPlayer}:{frame:ChibiWaterFrame;localPlayer?:boolean}){
 const root=useRef<T.Group>(null),bucket=useRef<T.Group>(null),water=useRef<T.Mesh>(null),stream=useRef<T.InstancedMesh>(null);
 const scratch=useMemo(()=>({start:new T.Vector3(),end:new T.Vector3(),control:new T.Vector3(),a:new T.Vector3(),b:new T.Vector3(),direction:new T.Vector3(),up:new T.Vector3(0,1,0),pose:new T.Object3D(),world:new T.Vector3()}),[]);
 useFrame(()=>{
  if(!root.current||!bucket.current||!stream.current)return;
  bucket.current.position.copy(frame.position);bucket.current.quaternion.copy(frame.rotation);bucket.current.scale.setScalar(frame.scale);
  if(water.current){water.current.visible=frame.fill>.02;water.current.position.y=.04+.22*frame.fill;water.current.scale.set(.10+.043*frame.fill,1,.10+.043*frame.fill);}
  stream.current.visible=frame.flow;if(!frame.flow)return;
  const s=scratch,state=useGame.getState();s.start.copy(frame.lip);root.current.getWorldPosition(s.world);
  let jar=WATER_JARS[0];for(const candidate of WATER_JARS)if(Math.hypot(candidate.x-s.world.x,candidate.z-s.world.z)<Math.hypot(jar.x-s.world.x,jar.z-s.world.z))jar=candidate;
  if(localPlayer&&state.waterQuest?.jar!==null&&state.waterQuest?.jar!==undefined)jar=WATER_JARS[state.waterQuest.jar]??jar;
  if(jar&&Math.hypot(jar.x-s.world.x,jar.z-s.world.z)<2){
   s.end.set(jar.x,jar.ground+jar.height+.025,jar.z);root.current.worldToLocal(s.end);
  }else s.end.copy(s.start).add(s.direction.set(0,-.34,.18));
  s.control.copy(s.start).lerp(s.end,.5);s.control.y=Math.max(s.start.y,s.end.y)+.025;
  for(let i=0;i<4;i++){streamPoint(i/4,s.a,s.start,s.control,s.end);streamPoint((i+1)/4,s.b,s.start,s.control,s.end);s.pose.position.copy(s.a).add(s.b).multiplyScalar(.5);s.direction.copy(s.b).sub(s.a);s.pose.scale.set(1,s.direction.length(),1);s.pose.quaternion.setFromUnitVectors(s.up,s.direction.normalize());s.pose.updateMatrix();stream.current.setMatrixAt(i,s.pose.matrix);}stream.current.instanceMatrix.needsUpdate=true;
 });
 return <group ref={root} name="Xo-muc-va-do-nuoc" dispose={null}><group ref={bucket}><mesh geometry={wellBucketGeometry} material={bucketMaterial}/><mesh ref={water} geometry={waterDiscGeometry} material={waterMaterial}/></group><instancedMesh ref={stream} args={[streamGeometry,streamMaterial,4]} frustumCulled={false}/></group>;
}
