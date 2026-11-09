import {RigidBody,CuboidCollider,CylinderCollider} from '@react-three/rapier';
import {templeColliders} from './templeCollisionData';
/** Only the walkable shell has physics; decorative triangles and roofs do not. */
export default function TempleCollision(){return <>{[true,false].map(wall=><RigidBody key={String(wall)} type="fixed" colliders={false} userData={{cameraWall:wall}}>{templeColliders.filter(s=>!!s.cameraWall===wall).map((shape,i)=>shape.kind==='box'?<CuboidCollider key={i} position={shape.position} rotation={[shape.rotationX||0,0,0]} args={shape.args as [number,number,number]}/>:<CylinderCollider key={i} position={shape.position} args={shape.args as [number,number]}/>)}</RigidBody>)}</>}
