import {useLayoutEffect,useMemo,useRef} from 'react';import {useFrame} from '@react-three/fiber';import {useTexture} from '@react-three/drei';import * as T from 'three';
import {useGame} from './gameStore';import {playerMotion} from './runtime';import {useReducedMotion} from './useReducedMotion';import {createLeafPool,advanceLeaf,collectLeaf,sampleLeaf,leafSources,LEAVES,type LeafPose} from './leafSimulation';import {createFallenLeafGeometry,createFallenLeafMaterial,leafVariant} from './fallenLeafSurface';import {createBroomContact,createSweepPose,sampleSweepPose,placeSweepContact,sweepContact} from './sweepMotion';
export default function TreeLeaves(){
 const mesh=useRef<T.InstancedMesh>(null),pool=useMemo(()=>createLeafPool(Date.now()),[]),quality=useGame(s=>s.quality),reduced=useReducedMotion(),atlas=useTexture('/assets/sweeping/bodhi-leaves-v1.webp'),geometry=useMemo(()=>createFallenLeafGeometry(LEAVES.perTree*leafSources.length),[]),material=useMemo(()=>createFallenLeafMaterial(atlas),[atlas]);
 const slots=useMemo(()=>quality==='low'?pool.filter(s=>s.index%2===0):pool,[pool,quality]),object=useRef(new T.Object3D()),pose=useRef<LeafPose>({x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:0}),frame=useRef(createSweepPose()),feet=useRef(new T.Vector3()),lastSweep=useRef(0),previous=useRef({x:0,z:0,valid:false}),contact=useRef(createBroomContact());
 useLayoutEffect(()=>{if(!mesh.current)return;mesh.current.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.current.count=slots.length;const variant=geometry.attributes.leafVariant;for(let i=0;i<slots.length;i++){slots[i].dirty=true;variant.setX(i,leafVariant(slots[i].seed));}variant.needsUpdate=true;
  const box=new T.Box3(),padding=1;for(const s of leafSources){box.expandByPoint(new T.Vector3(s.x-s.maxRadius-padding,0,s.z-s.maxRadius-padding));box.expandByPoint(new T.Vector3(s.x+s.maxRadius+padding,s.canopyY+1,s.z+s.maxRadius+padding));}mesh.current.boundingSphere=box.getBoundingSphere(new T.Sphere());
 },[slots,reduced,geometry]);
 useFrame(()=>{const m=mesh.current;if(!m||document.hidden)return;const now=Date.now(),state=useGame.getState(),active=state.action==='sweep'&&sweepContact.ready&&state.started&&state.characterConfigured&&!state.panel&&!state.seated,elapsed=now-lastSweep.current,sweep=active&&elapsed>=(quality==='low'?50:33);let collected=0,changed=false;
  if(!active)previous.current.valid=false;
  if(sweep){sampleSweepPose(now,reduced,frame.current);const f=frame.current;playerMotion.object?playerMotion.object.getWorldPosition(feet.current):feet.current.set(state.position[0],state.height,state.position[1]);placeSweepContact(f,feet.current.x,feet.current.z,feet.current.y+.025,playerMotion.object?playerMotion.heading:state.heading,previous.current,elapsed,contact.current);lastSweep.current=now;
  }
  for(let i=0;i<slots.length;i++){const slot=slots[i];advanceLeaf(slot,now);if(sweep&&collectLeaf(slot,now,contact.current))collected++;
   const moving=(!reduced&&now-slot.fallAt<LEAVES.fallMs)||(!reduced&&slot.collectedAt>0&&now-slot.collectedAt<LEAVES.gatherMs);if(!moving&&!slot.dirty)continue;sampleLeaf(slot,now,reduced,pose.current);const p=pose.current;object.current.position.set(p.x,p.y,p.z);object.current.rotation.set(p.rx,p.ry,p.rz);object.current.scale.setScalar(p.scale);object.current.updateMatrix();m.setMatrixAt(i,object.current.matrix);changed=true;slot.dirty=moving;
  }
  if(changed)m.instanceMatrix.needsUpdate=true;
  if(collected){
   sweepContact.at=now;sweepContact.side=frame.current.side;sweepContact.strength=Math.min(1,.45+collected*.12);
   state.record('sweep',collected);
   const reward=useGame.getState().merit-state.merit;
   if(reward>0)state.notify(`Lá về cội. +${reward} công đức`);
  }
 });
 return <instancedMesh name="La-bo-de-texture-ba-goc-cay" ref={mesh} args={[geometry,material,LEAVES.perTree*leafSources.length]} receiveShadow dispose={null}/>;
}
