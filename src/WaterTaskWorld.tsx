import {useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RigidBody,CuboidCollider} from '@react-three/rapier';
import * as T from 'three';
import {useGame} from './gameStore';
import {WATER_WELL,WATER_JARS,WATER_TASK,jarUnits,jarWaterHeight,jarWaterRadius,nearWaterWell,nearestWaterJar,nearWaterJar} from './waterTaskData';
import {wellRopeLineGeometry,wellBucketGeometry,waterDiscGeometry,wellWoodMaterial,wellDepthMaterial,waterMaterial,bucketMaterial} from './waterTaskGeometry';
import {useWaterStationAssets} from './waterStationAssets';
import {WELL_VISUAL} from './waterAssetLayout';
import {finishInstanceLayout} from './geometryBatch';
import {useCameraOccluder} from './cameraObstruction';
import {NearbyOverlay} from './Environment';

export default function WaterTaskWorld(){
  const assets=useWaterStationAssets(),quality=useGame(s=>s.quality);
  const jars=useRef<T.InstancedMesh>(null),water=useRef<T.InstancedMesh>(null);
  const bucket=useRef<T.Mesh>(null),rope=useRef<T.Mesh>(null),lastDraw=useRef(-1);
  const stone=useRef<T.Mesh>(null),arch=useRef<T.Mesh>(null);
  useCameraOccluder(stone);useCameraOccluder(arch);
  const levels=useGame(s=>s.waterJars),position=useGame(s=>s.position),quest=useGame(s=>s.waterQuest);
  const levelKey=useGame(s=>s.waterJars.map(j=>jarUnits(j)).join(','));
  const units=useMemo(()=>levelKey.split(',').map(Number),[levelKey]);
  const nearJar=nearestWaterJar(position,levels),atWell=nearWaterWell(position);
  useLayoutEffect(()=>{
    const mesh=jars.current!,pose=new T.Object3D();
    for(const jar of WATER_JARS){
      pose.position.set(jar.x,jar.ground,jar.z);
      pose.rotation.y=jar.id*.63;pose.updateMatrix();mesh.setMatrixAt(jar.id,pose.matrix);
    }
    finishInstanceLayout(mesh);
  },[assets.jar]);
  useLayoutEffect(()=>{
    const mesh=water.current!,pose=new T.Object3D();
    pose.position.set(WATER_WELL.x,WATER_WELL.ground+WELL_VISUAL.waterY,WATER_WELL.z);
    pose.scale.setScalar(WELL_VISUAL.waterRadius);pose.updateMatrix();mesh.setMatrixAt(0,pose.matrix);
    for(const jar of WATER_JARS){
      const count=units[jar.id]||0,fill=count/WATER_TASK.jarCapacity;
      pose.position.set(jar.x,jar.ground+jarWaterHeight(fill),jar.z);
      pose.scale.setScalar(count?jarWaterRadius(fill):0);pose.updateMatrix();mesh.setMatrixAt(jar.id+1,pose.matrix);
    }
    finishInstanceLayout(mesh);
  },[units]);
  useFrame(()=>{
    const q=useGame.getState().waterQuest;
    const progress=q?.phase==='drawing'?Math.min(1,(Date.now()-q.phaseAt)/WATER_TASK.drawMs):0;
    if(progress===lastDraw.current)return;
    lastDraw.current=progress;
    const bottom=T.MathUtils.lerp(WELL_VISUAL.bucketLow,WELL_VISUAL.bucketHigh,progress),end=bottom+.36;
    if(bucket.current)bucket.current.position.y=bottom;
    if(rope.current){rope.current.position.y=(WELL_VISUAL.pulleyY+end)/2;rope.current.scale.y=WELL_VISUAL.pulleyY-end;}
  });
  const clickWell=()=>useGame.getState().waterTask();
  return <group name="Gieng-da-va-bon-lu-men-nau" dispose={null}>
    <group position={[WATER_WELL.x,WATER_WELL.ground,WATER_WELL.z]} onClick={e=>{if(e.delta>5)return;e.stopPropagation();clickWell()}}>
      <mesh ref={stone} geometry={assets.stone} material={assets.stoneMaterial} castShadow={quality==='high'} receiveShadow/>
      <mesh ref={arch} geometry={assets.arch} material={assets.archMaterial} castShadow={quality==='high'} receiveShadow/>
      <mesh geometry={waterDiscGeometry} material={wellDepthMaterial} position-y={.08} scale={.72}/>
      <mesh ref={rope} position={[WELL_VISUAL.ropeX,0,WELL_VISUAL.ropeZ]} geometry={wellRopeLineGeometry} material={wellWoodMaterial}/>
      <mesh ref={bucket} position={[WELL_VISUAL.ropeX,WELL_VISUAL.bucketLow,WELL_VISUAL.ropeZ]} geometry={wellBucketGeometry} material={bucketMaterial}/>
    </group>
    <instancedMesh ref={jars} args={[assets.jar,assets.jarMaterial,4]} castShadow={quality==='high'} receiveShadow onClick={e=>{
      if(e.delta>5||e.instanceId===undefined)return;e.stopPropagation();useGame.getState().waterTask(e.instanceId);
    }}/>
    <instancedMesh ref={water} args={[waterDiscGeometry,waterMaterial,5]}/>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider position={[WATER_WELL.x,2.72,WATER_WELL.z-.08]} args={[.68,.16,.18]}/>
    </RigidBody>
    <NearbyOverlay position={[WATER_WELL.x,3.2,WATER_WELL.z]} maxDistance={13}>
      <button className="npc-tag water-station" onClick={clickWell}><strong>Giếng nước sân chùa</strong><span>{quest?'Đã nhận gánh · Mang về lu sau bếp':atWell?'Nhận nước · E':'Gánh nước về bếp chay'}</span></button>
    </NearbyOverlay>
    {nearJar&&nearWaterJar(position,nearJar.id)&&<NearbyOverlay position={[nearJar.x,1.65,nearJar.z]} maxDistance={8}>
      <button className="npc-tag water-station" onClick={()=>useGame.getState().waterTask(nearJar.id)}><strong>Lu nước {nearJar.id+1} · Bếp chay</strong><span>{units[nearJar.id]}/{WATER_TASK.jarCapacity} gánh · {quest?.phase==='carrying'?'Rót nước · E':'+8 công đức / chuyến'}</span></button>
    </NearbyOverlay>}
  </group>;
}
