import {RigidBody,CuboidCollider,CylinderCollider} from '@react-three/rapier';
import {courtyardSolids} from './courtyardCollisionData';
import {stoneBenches,BENCH_GROUND} from './stoneBenchData';
import {souvenirStalls,souvenirCameraParts} from './souvenirData';
export default function CourtyardCollision(){return <><RigidBody type="fixed" colliders={false}>
 {courtyardSolids.map(s=>s.round?<CylinderCollider key={s.id} position={[s.x,(s.base??0)+s.height/2,s.z]} args={[s.height/2,s.w/2]}/>:<CuboidCollider key={s.id} position={[s.x,(s.base??0)+s.height/2,s.z]} args={[s.w/2,s.height/2,s.d/2]}/>)}
 {stoneBenches.map(b=><group key={b.id} position={[b.x,BENCH_GROUND,b.z]} rotation={[0,b.rotation,0]}>
  <CuboidCollider position={[0,.25,0]} args={[1.15,.25,.32]}/>
  <CuboidCollider position={[0,.78,-.26]} args={[1.15,.28,.07]}/>
 </group>)}
 </RigidBody>
 {souvenirStalls.map(stall=><RigidBody key={stall.id} type="fixed" colliders={false} position={[stall.x,0,stall.z]} rotation={[0,stall.rotation,0]} userData={{cameraWall:true}}>
  {souvenirCameraParts.map((part,i)=><CuboidCollider key={i} position={part.position} rotation={part.rotation} args={[part.size[0]/2,part.size[1]/2,part.size[2]/2]}/>) }
 </RigidBody>)}</>}
