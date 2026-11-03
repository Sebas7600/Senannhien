import {useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import {benchNearGeometry,benchFarGeometry} from './benchGeometry';
import {terrazzoMaterial,type BenchFinish} from './terrazzo';
import {stoneBenches,BENCH_GROUND} from './stoneBenchData';
import {useGame} from './gameStore';
type Bench=typeof stoneBenches[number];
function BenchBatch({finish}:{finish:BenchFinish}){const entries=useMemo(()=>stoneBenches.filter(b=>b.finish===finish),[finish]),near=useRef<THREE.InstancedMesh>(null),far=useRef<THREE.InstancedMesh>(null),nearItems=useRef<Bench[]>([]),farItems=useRef<Bench[]>([]),levels=useRef(new Map<number,boolean>()),signature=useRef('initial'),nextCheck=useRef(0),object=useRef(new THREE.Object3D());
  const write=(mesh:THREE.InstancedMesh|null,items:Bench[])=>{if(!mesh)return;mesh.count=items.length;mesh.visible=items.length>0;items.forEach((b,i)=>{object.current.position.set(b.x,BENCH_GROUND,b.z);object.current.rotation.set(0,b.rotation,0);object.current.updateMatrix();mesh.setMatrixAt(i,object.current.matrix)});mesh.instanceMatrix.needsUpdate=true;if(items.length){mesh.computeBoundingBox();mesh.computeBoundingSphere()}};
  useLayoutEffect(()=>{nearItems.current=[...entries];write(near.current,entries);write(far.current,[])},[entries]);
  useFrame(({camera,clock})=>{if(clock.elapsedTime<nextCheck.current)return;nextCheck.current=clock.elapsedTime+.25;const n:Bench[]=[],f:Bench[]=[];for(const b of entries){const distance=Math.hypot(camera.position.x-b.x,camera.position.y-.5,camera.position.z-b.z),threshold=useGame.getState().quality==='low'?(levels.current.get(b.id)?10:8):(levels.current.get(b.id)?20:17),close=distance<threshold;levels.current.set(b.id,close);(close?n:f).push(b)}const key=n.map(b=>b.id).join(',');if(key===signature.current)return;signature.current=key;nearItems.current=n;farItems.current=f;write(near.current,n);write(far.current,f)});
  const click=(event:ThreeEvent<MouseEvent>,items:Bench[])=>{if(event.delta>5||event.instanceId===undefined)return;const b=items[event.instanceId];if(!b)return;event.stopPropagation();const s=useGame.getState(),side=(event.point.x-b.x)*Math.cos(b.rotation)-(event.point.z-b.z)*Math.sin(b.rotation)<0?0:1;const preferred=`bench-${b.id}-${side}`,other=`bench-${b.id}-${1-side}`;s.sit(s.peers.some(p=>p.seat===preferred)?other:preferred)};
  return <><instancedMesh ref={near} args={[benchNearGeometry,terrazzoMaterial(finish,'near'),entries.length]} castShadow receiveShadow onClick={e=>click(e,nearItems.current)} dispose={null}/><instancedMesh ref={far} args={[benchFarGeometry,terrazzoMaterial(finish,'far'),entries.length]} receiveShadow onClick={e=>click(e,farItems.current)} dispose={null}/></>;
}
export default function BenchBatches(){return <>{(['jade','brick','ivory'] as const).map(f=><BenchBatch key={f} finish={f}/>)}</>}
