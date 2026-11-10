import {foodIsActive,POND} from './pondLayout';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {InstancedMesh,Object3D} from 'three';
import {useGame} from './gameStore';
export default function FishFood(){const ref=useRef<InstancedMesh>(null),obj=useRef(new Object3D()),elapsed=useRef(0);
 useFrame((_,dt)=>{elapsed.current+=dt;if(elapsed.current<1/15||!ref.current)return;elapsed.current=0;let index=0;
 for(const feed of useGame.getState().fishFeeds.filter(f=>foodIsActive(f,Date.now())).slice(-12))for(let i=0;i<8;i++){obj.current.position.set(feed.x+Math.sin(i*2.4)*.6,POND.waterY+.035,feed.z+Math.cos(i*2.4)*.6);obj.current.updateMatrix();ref.current.setMatrixAt(index++,obj.current.matrix)}
 ref.current.count=index;ref.current.instanceMatrix.needsUpdate=true;
 });return <instancedMesh ref={ref} args={[undefined,undefined,96]} frustumCulled={false}><sphereGeometry args={[.035,5,4]}/><meshStandardMaterial color="#bca16b"/></instancedMesh>
}
