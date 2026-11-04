import {useLayoutEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RigidBody,CuboidCollider} from '@react-three/rapier';
import * as T from 'three';
import {useGame} from './gameStore';
import {WATER_WELL,WATER_JARS,WATER_TASK,jarUnits,jarWaterRadius,nearWaterWell,nearestWaterJar,nearWaterJar} from './waterTaskData';
import {wellStoneGeometry,wellFrameGeometry,wellRopeGeometry,wellRopeLineGeometry,wellBucketGeometry,waterJarGeometry,waterDiscGeometry,wellStoneMaterial,wellWoodMaterial,jarMaterial,waterMaterial,bucketMaterial} from './waterTaskGeometry';
import {NearbyOverlay} from './Environment';
export default function WaterTaskWorld(){
  const jars=useRef<T.InstancedMesh>(null),water=useRef<T.InstancedMesh>(null),object=useRef(new T.Object3D()),bucket=useRef<T.Mesh>(null),rope=useRef<T.Mesh>(null);
  const levels=useGame(s=>s.waterJars),seconds=useGame(s=>s.sessionSeconds),position=useGame(s=>s.position),quest=useGame(s=>s.waterQuest),nearJar=nearestWaterJar(position,levels),atWell=nearWaterWell(position);
  useLayoutEffect(()=>{if(!jars.current)return;for(const j of WATER_JARS){object.current.position.set(j.x,j.ground,j.z);object.current.scale.set(1,1,1);object.current.updateMatrix();jars.current.setMatrixAt(j.id,object.current.matrix);}jars.current.instanceMatrix.needsUpdate=true;jars.current.computeBoundingBox();jars.current.computeBoundingSphere()},[]);
  useLayoutEffect(()=>{const mesh=water.current;if(!mesh)return;object.current.position.set(WATER_WELL.x,.29,WATER_WELL.z);object.current.scale.set(.8,1,.8);object.current.updateMatrix();mesh.setMatrixAt(0,object.current.matrix);
    for(const j of WATER_JARS){const units=jarUnits(levels[j.id]),fill=units/WATER_TASK.jarCapacity;object.current.position.set(j.x,j.ground+.22+fill*.69,j.z);object.current.scale.setScalar(units ? jarWaterRadius(fill) : 0);object.current.updateMatrix();mesh.setMatrixAt(j.id+1,object.current.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();
  },[levels,seconds]);
  useFrame(()=>{const q=useGame.getState().waterQuest,t=q?.phase==='drawing'?Math.min(1,(Date.now()-q.phaseAt)/WATER_TASK.drawMs):0,bottom=.30+t*.67,end=bottom+.36;if(bucket.current)bucket.current.position.y=bottom;if(rope.current){rope.current.position.y=(1.99+end)/2;rope.current.scale.y=1.99-end;}});
  const clickWell=()=>useGame.getState().waterTask();
  return <group name="Gieng-va-bon-lu-nuoc" dispose={null}>
    <group position={[WATER_WELL.x,WATER_WELL.ground,WATER_WELL.z]} onClick={e=>{if(e.delta>5)return;e.stopPropagation();clickWell()}}>
      <mesh geometry={wellStoneGeometry} material={wellStoneMaterial} receiveShadow/>
      <mesh geometry={wellFrameGeometry} material={wellWoodMaterial}/>
      <mesh geometry={wellRopeGeometry} material={wellWoodMaterial}/>
      <mesh ref={rope} geometry={wellRopeLineGeometry} material={wellWoodMaterial}/>
      <mesh ref={bucket} geometry={wellBucketGeometry} material={bucketMaterial}/>
    </group>
    <instancedMesh ref={jars} args={[waterJarGeometry,jarMaterial,4]} receiveShadow onClick={e=>{if(e.delta>5||e.instanceId===undefined)return;e.stopPropagation();useGame.getState().waterTask(e.instanceId)}}/>
    <instancedMesh ref={water} args={[waterDiscGeometry,waterMaterial,5]}/>
    <RigidBody type="fixed" colliders={false}>{[-1,1].map(side=><CuboidCollider key={side} position={[WATER_WELL.x+side*.99,1.4,WATER_WELL.z]} args={[.07,1.3,.09]}/>)}</RigidBody>
    <NearbyOverlay position={[WATER_WELL.x,3.1,WATER_WELL.z]} maxDistance={13}><button className="npc-tag water-station" onClick={clickWell}><strong>Giếng nước sân chùa</strong><span>{quest?'Đã nhận gánh · Mang về lu sau bếp':atWell?'Nhận nước · E':'Gánh nước về bếp chay'}</span></button></NearbyOverlay>
    {nearJar&&nearWaterJar(position,nearJar.id)&&<NearbyOverlay position={[nearJar.x,1.65,nearJar.z]} maxDistance={8}><button className="npc-tag water-station" onClick={()=>useGame.getState().waterTask(nearJar.id)}><strong>Lu nước {nearJar.id+1} · Bếp chay</strong><span>{jarUnits(levels[nearJar.id])}/{WATER_TASK.jarCapacity} gánh · {quest?.phase==='carrying'?'Rót nước · E':'+8 công đức / chuyến'}</span></button></NearbyOverlay>}
  </group>;
}
