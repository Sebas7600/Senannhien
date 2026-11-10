import {submitSweep} from './worldTransport';
import {createClientId} from './clientIds';
import {useLayoutEffect,useMemo,useRef} from 'react';import {useFrame} from '@react-three/fiber';import {useTexture} from '@react-three/drei';import * as T from 'three';
import {useGame} from './gameStore';import {playerMotion} from './runtime';import {useReducedMotion} from './useReducedMotion';import {createLeafPool,advanceLeaf,collectLeaf,sampleLeaf,leafSources,LEAVES,type LeafPose} from './leafSimulation';import {createFallenLeafGeometry,createFallenLeafMaterial,leafVariant} from './fallenLeafSurface';import {createBroomContact,createSweepPose,sampleChibiSweepPose,placeSweepContact,sweepContact} from './sweepMotion';
export default function TreeLeaves(){
 const mesh=useRef<T.InstancedMesh>(null),pool=useMemo(()=>createLeafPool(Date.now()),[]),quality=useGame(s=>s.quality),reduced=useReducedMotion(),atlas=useTexture('/assets/sweeping/bodhi-leaves-v1.webp'),geometry=useMemo(()=>createFallenLeafGeometry(LEAVES.perTree*leafSources.length),[]),material=useMemo(()=>createFallenLeafMaterial(atlas),[atlas]);
 const slots=pool,object=useRef(new T.Object3D()),pose=useRef<LeafPose>({x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:0}),frame=useRef(createSweepPose()),feet=useRef(new T.Vector3()),lastSweep=useRef(0),previous=useRef({x:0,z:0,valid:false}),contact=useRef(createBroomContact());
 const sync=useRef({epoch:0,room:'',request:false}),pending=useRef(new Set<number>()),remoteCache=useRef({snapshot:null as object|null,map:new Map<number,number[]>()});
 useLayoutEffect(()=>{if(!mesh.current)return;mesh.current.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.current.count=slots.length;const variant=geometry.attributes.leafVariant;for(let i=0;i<slots.length;i++){slots[i].dirty=true;variant.setX(i,leafVariant(slots[i].seed));}variant.needsUpdate=true;
  const box=new T.Box3(),padding=1;for(const s of leafSources){box.expandByPoint(new T.Vector3(s.x-s.maxRadius-padding,0,s.z-s.maxRadius-padding));box.expandByPoint(new T.Vector3(s.x+s.maxRadius+padding,s.canopyY+1,s.z+s.maxRadius+padding));}mesh.current.boundingSphere=box.getBoundingSphere(new T.Sphere());
 },[slots,reduced,geometry]);
 useFrame(()=>{const m=mesh.current;if(!m||document.hidden)return;const state=useGame.getState(),online=state.connection==='online'&&!!state.sharedWorld,shared=online?state.sharedWorld:null,now=Date.now()-(shared?.serverOffset??0),active=state.action==='sweep'&&sweepContact.ready&&state.started&&state.characterConfigured&&!state.panel&&!state.seated,elapsed=now-lastSweep.current,sweep=active&&elapsed>=(quality==='low'?50:33);let collected=0,changed=false;const seeds:number[]=[];
  if(shared&&(sync.current.epoch!==shared.leaves.epoch||sync.current.room!==state.room)){pool.splice(0,pool.length,...createLeafPool(shared.leaves.epoch));sync.current.epoch=shared.leaves.epoch;sync.current.room=state.room;lastSweep.current=0;pending.current.clear();previous.current.valid=false;}
  if(shared&&remoteCache.current.snapshot!==shared.leaves){remoteCache.current.snapshot=shared.leaves;remoteCache.current.map=new Map(shared.leaves.cleared.map(c=>[c[0],c]));}
  const cleared=shared?remoteCache.current.map:null;
  if(!active)previous.current.valid=false;
  if(sweep){sampleChibiSweepPose(Date.now(),reduced,frame.current);const f=frame.current;playerMotion.object?playerMotion.object.getWorldPosition(feet.current):feet.current.set(state.position[0],state.height,state.position[1]);placeSweepContact(f,feet.current.x,feet.current.z,feet.current.y+.025,playerMotion.object?playerMotion.heading:state.heading,previous.current,elapsed,contact.current);lastSweep.current=now;
  }
  for(let i=0;i<slots.length;i++){const slot=slots[i];advanceLeaf(slot,now);
   const remote=cleared?.get(slot.seed);if(remote&&slot.collectedAt!==remote[2]){slot.fallAt=remote[1];slot.collectedAt=remote[2];slot.gatherX=remote[3];slot.gatherZ=remote[4];slot.dirty=true;}
   if(sweep){if(online){if(!sync.current.request&&!pending.current.has(slot.seed)&&collectLeaf({...slot},now,contact.current))seeds.push(slot.seed);}else if(collectLeaf(slot,now,contact.current))collected++;}
   const moving=(!reduced&&now-slot.fallAt<LEAVES.fallMs)||(!reduced&&slot.collectedAt>0&&now-slot.collectedAt<LEAVES.gatherMs);if(!moving&&!slot.dirty)continue;sampleLeaf(slot,now,reduced,pose.current);const p=pose.current;object.current.position.set(p.x,p.y,p.z);object.current.rotation.set(p.rx,p.ry,p.rz);object.current.scale.setScalar(p.scale);object.current.updateMatrix();m.setMatrixAt(i,object.current.matrix);changed=true;slot.dirty=moving;
  }
  if(changed)m.instanceMatrix.needsUpdate=true;
  if(seeds.length&&online&&!sync.current.request){
   sync.current.request=true;seeds.forEach(seed=>pending.current.add(seed));const room=state.room;
   void submitSweep({operation:createClientId(),seeds,contact:{...contact.current}}).then(count=>{const current=useGame.getState();if(current.room!==room||!count)return;current.record('sweep',count);sweepContact.at=Date.now();sweepContact.side=frame.current.side;sweepContact.strength=Math.min(1,.45+count*.12);}).catch(()=>{}).finally(()=>{seeds.forEach(seed=>pending.current.delete(seed));sync.current.request=false;});
  }
  if(collected){
   sweepContact.at=now;sweepContact.side=frame.current.side;sweepContact.strength=Math.min(1,.45+collected*.12);
   state.record('sweep',collected);
   const reward=useGame.getState().merit-state.merit;
   if(reward>0)state.notify(`Lá về cội. +${reward} công đức`);
  }
 });
 return <instancedMesh name="La-bo-de-texture-ba-goc-cay" ref={mesh} args={[geometry,material,LEAVES.perTree*leafSources.length]} receiveShadow dispose={null}/>;
}
