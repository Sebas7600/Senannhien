import {useLayoutEffect,useRef} from 'react';
import {useFrame,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import type {Seat} from './gameData';
import {cushionSeats,cushionBaseY,cushionScale} from './cushionPlacement';
import {cushionNearGeometry,cushionFarGeometry} from './cushionGeometry';
import {useCushionMaterial} from './cushionMaterial';
import {useGame} from './gameStore';
export {cushionSeats} from './cushionPlacement';
export default function CushionBatches(){
  const nearMaterial=useCushionMaterial('near'),farMaterial=useCushionMaterial('far');
  const near=useRef<THREE.InstancedMesh>(null),far=useRef<THREE.InstancedMesh>(null),nearItems=useRef<Seat[]>([]),farItems=useRef<Seat[]>([]);
  const object=useRef(new THREE.Object3D()),color=useRef(new THREE.Color()),levels=useRef(new Map<string,boolean>()),signature=useRef('initial'),nextCheck=useRef(0);
  const selected=useGame(s=>s.seated),occupied=useGame(s=>s.peers.map(p=>p.seat||'').sort().join('|')),quality=useGame(s=>s.quality);
  function write(mesh:THREE.InstancedMesh|null,items:Seat[]){if(!mesh)return;const state=useGame.getState();mesh.count=items.length;mesh.visible=items.length>0;
    items.forEach((s,i)=>{object.current.position.set(s.position[0],cushionBaseY(s),s.position[2]);object.current.rotation.set(0,s.rotation,0);object.current.scale.set(...cushionScale(s));object.current.updateMatrix();mesh.setMatrixAt(i,object.current.matrix);
      color.current.set(state.seated===s.id?'#fff1cf':state.peers.some(p=>p.seat===s.id)?'#c4cbb6':'#ffffff');mesh.setColorAt(i,color.current);
    });mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;if(items.length){mesh.computeBoundingBox();mesh.computeBoundingSphere()}
  }
  useLayoutEffect(()=>{const low=useGame.getState().quality==='low';nearItems.current=low?[]:cushionSeats;farItems.current=low?cushionSeats:[];write(near.current,nearItems.current);write(far.current,farItems.current)},[]);
  useLayoutEffect(()=>{signature.current='dirty';nextCheck.current=0},[selected,occupied,quality]);
  useFrame(({camera,clock})=>{if(clock.elapsedTime<nextCheck.current)return;nextCheck.current=clock.elapsedTime+.3;const n:Seat[]=[],f:Seat[]=[];
    for(const s of cushionSeats){const threshold=levels.current.get(s.id)?16:14,distance=Math.hypot(camera.position.x-s.position[0],camera.position.y-s.position[1],camera.position.z-s.position[2]),close=quality!=='low'&&distance<threshold;levels.current.set(s.id,close);(close?n:f).push(s)}
    const key=n.map(s=>s.id).join(',')+';'+selected+';'+occupied;if(key===signature.current)return;signature.current=key;nearItems.current=n;farItems.current=f;write(near.current,n);write(far.current,f);
  });
  function click(event:ThreeEvent<MouseEvent>,items:Seat[]){if(event.delta>5||event.instanceId===undefined)return;const seat=items[event.instanceId];if(seat){event.stopPropagation();useGame.getState().sit(seat.id)}}
  const active=cushionSeats.find(s=>s.id===selected);
  return <group name="Bo-doan-Lien-Thuy" dispose={null}>
    <instancedMesh ref={near} args={[cushionNearGeometry,nearMaterial,cushionSeats.length]} receiveShadow castShadow onClick={e=>click(e,nearItems.current)}/>
    <instancedMesh ref={far} args={[cushionFarGeometry,farMaterial,cushionSeats.length]} receiveShadow onClick={e=>click(e,farItems.current)}/>
    {active&&<mesh position={[active.position[0],cushionBaseY(active)+.006,active.position[2]]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.65,.72,40]}/><meshBasicMaterial color="#e0c98a" transparent opacity={.28} depthWrite={false}/></mesh>}
  </group>;
}
