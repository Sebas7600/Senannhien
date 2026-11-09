import {QueryFilterFlags,type World,type Ball,type Vector} from '@dimforge/rapier3d-compat';
const rotation={x:0,y:0,z:0,w:1};
/** Sweep a small camera volume against existing fixed hitboxes, including wall corners. */
export function cameraSafeDistance(world:World,origin:Vector,direction:Vector,desired:number,shape:Ball){
 const hit=world.castShape(origin,rotation,direction,shape,0,desired,true,QueryFilterFlags.EXCLUDE_DYNAMIC|QueryFilterFlags.EXCLUDE_KINEMATIC|QueryFilterFlags.EXCLUDE_SENSORS,undefined,undefined,undefined,collider=>(collider.parent()?.userData as {cameraWall?:boolean}|undefined)?.cameraWall===true);
 return hit?Math.max(.08,Math.min(desired,hit.time_of_impact-.05)):desired;
}
