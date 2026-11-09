import {RigidBody,CuboidCollider,CylinderCollider} from '@react-three/rapier';
import {courtyardSolids} from './courtyardCollisionData';
import {stoneBenches,BENCH_GROUND} from './stoneBenchData';
export default function CourtyardCollision(){return <RigidBody type="fixed" colliders={false}>
 {courtyardSolids.map(s=>s.round?<CylinderCollider key={s.id} position={[s.x,(s.base??0)+s.height/2,s.z]} args={[s.height/2,s.w/2]}/>:<CuboidCollider key={s.id} position={[s.x,(s.base??0)+s.height/2,s.z]} args={[s.w/2,s.height/2,s.d/2]}/>)}
 {stoneBenches.map(b=><group key={b.id} position={[b.x,BENCH_GROUND,b.z]} rotation={[0,b.rotation,0]}>
  <CuboidCollider position={[0,.25,0]} args={[1.15,.25,.32]}/>
  <CuboidCollider position={[0,.78,-.26]} args={[1.15,.28,.07]}/>
 </group>)}
 </RigidBody>}
