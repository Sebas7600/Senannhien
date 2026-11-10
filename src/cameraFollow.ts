import type {Vector3} from 'three';
export const DEFAULT_FOLLOW_DISTANCE=6.5;
/** Slide with lateral movement; only walking away restores a wall-compressed gap. */
export function followAfterObstruction(camera:Vector3,previousTarget:Vector3,target:Vector3,desired:number){
 const ox=camera.x-previousTarget.x,oy=camera.y-previousTarget.y,oz=camera.z-previousTarget.z;
 const horizontal=Math.hypot(ox,oz),distance=Math.hypot(horizontal,oy);
 const dx=target.x-previousTarget.x,dy=target.y-previousTarget.y,dz=target.z-previousTarget.z;
 let restore=0,ux=0,uz=0;
 if(horizontal>.00001&&distance<desired-.03){
  ux=ox/horizontal;uz=oz/horizontal;
  const away=-(dx*ux+dz*uz),limit=Math.sqrt(Math.max(0,desired*desired-oy*oy));
  restore=Math.max(0,Math.min(away,limit-horizontal));
 }
 // Tangential movement always translates the camera with the character, so
 // strafing along a wall does not rotate the orbit around a stationary camera.
 camera.x+=dx+ux*restore;camera.y+=dy;camera.z+=dz+uz*restore;
}

/** Filter staircase treads without changing the user's orbit direction. */
export function smoothCameraElevation(current:number,desired:number,dt:number){return desired+(current-desired)*Math.exp(-6*Math.min(.05,Math.max(0,dt)));}
