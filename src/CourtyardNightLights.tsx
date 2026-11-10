import {eveningPosts} from './eveningDecorData';
import {useLayoutEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {pathLamps} from './courtyardPropsData';
import {pavilionLayouts} from './gameData';
import {useGame} from './gameStore';
import {playerMotion} from './runtime';

const ceilingFixtures=[
  ...pavilionLayouts.flatMap(room=>[-1,1].flatMap(side=>[-1,1].map(row=>({
    x:room.x+side*room.w*.245,y:3.72,z:room.z+row*room.d*.22,range:9.4,intensity:48,
  })))),
];
const closest=<T extends {x:number;z:number}>(points:T[],x:number,z:number,count:number)=>
  points.map(point=>({point,distance:(point.x-x)**2+(point.z-z)**2}))
    .sort((a,b)=>a.distance-b.distance).slice(0,count);

function CeilingFixtures(){
  const mounts=useRef<THREE.InstancedMesh>(null),glass=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const matrix=new THREE.Matrix4();
    for(const [mesh,offset] of [[mounts.current!,0],[glass.current!,-.05]] as const){
      ceilingFixtures.forEach(({x,y,z},i)=>mesh.setMatrixAt(i,matrix.makeTranslation(x,y+offset,z)));
      mesh.instanceMatrix.needsUpdate=true;
      mesh.computeBoundingSphere();
    }
  },[]);
  return <>
    <instancedMesh ref={mounts} args={[undefined,undefined,ceilingFixtures.length]}>
      <cylinderGeometry args={[.25,.31,.115,12]}/>
      <meshStandardMaterial color="#524b43" roughness={.62}/>
    </instancedMesh>
    <instancedMesh ref={glass} args={[undefined,undefined,ceilingFixtures.length]}>
      <cylinderGeometry args={[.266,.24,.068,16]}/>
      <meshBasicMaterial color="#ffe6b6"/>
    </instancedMesh>
  </>;
}

export default function CourtyardNightLights(){
  const low=useGame(s=>s.quality==='low');
  // The visible lamps all glow, while only nearby fixtures need dynamic shading.
  const pointCount=low?1:2,spotCount=2;
  const points=useRef<(THREE.PointLight|null)[]>([]),spots=useRef<(THREE.SpotLight|null)[]>([]);
  const focus=useRef(new THREE.Vector3()),last=useRef(new THREE.Vector2(Infinity,Infinity));
  const elapsed=useRef(1);
  useLayoutEffect(()=>{
    const active=spots.current.filter((light):light is THREE.SpotLight=>!!light);
    for(const light of active){
      light.target.position.set(0,-1,0);
      light.add(light.target);
    }
    last.current.set(Infinity,Infinity);
    return ()=>{for(const light of active)light.remove(light.target);};
  },[pointCount]);
  useFrame((_,dt)=>{
    elapsed.current+=dt;
    if(elapsed.current<.12)return;
    elapsed.current=0;
    const {position}=useGame.getState();
    if(playerMotion.object)playerMotion.object.getWorldPosition(focus.current);
    else focus.current.set(position[0],0,position[1]);
    const {x,z}=focus.current;
    if(Math.hypot(last.current.x-x,last.current.y-z)<.38)return;
    last.current.set(x,z);
    closest([...pathLamps.map(p=>({...p,y:.80})),...eveningPosts.map(p=>({...p,y:2.7}))],x,z,pointCount).forEach(({point,distance},i)=>{
      const light=points.current[i];
      if(!light)return;
      light.position.set(point.x,point.y,point.z);
      light.intensity=distance<18**2?10:0;
    });
    closest(ceilingFixtures,x,z,spotCount).forEach(({point,distance},i)=>{
      const light=spots.current[i];
      if(!light)return;
      light.position.set(point.x,point.y-.13,point.z);
      light.target.updateWorldMatrix(true,false);
      light.distance=point.range;
      light.intensity=distance<20**2?point.intensity:0;
    });
  });
  return <>
    <CeilingFixtures/>
    {Array.from({length:pointCount},(_,i)=><pointLight key={i}
      ref={light=>{points.current[i]=light;}} color="#ffd199" intensity={0} distance={8} decay={2}/>)}
    {Array.from({length:spotCount},(_,i)=><spotLight key={i}
      ref={light=>{spots.current[i]=light;}} color="#ffe2b1" intensity={0}
      angle={1.03} penumbra={.68} distance={10} decay={2}/>)}
  </>;
}
