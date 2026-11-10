import {driftingLotusAnchors} from './lotusLayout';
import {POND} from './pondLayout';
import type {Vec3} from './gameData';

export const BELL_DURATION = 6000;
export const LANTERN_RISE = 4200;
export const LANTERN_LIFETIME = 120000;
export const MAX_LANTERNS = 8;
export {WISH_STATION,WISH_APPROACH} from './gameData';

// Stable per-lantern variation: no random allocations or React updates in the render loop.
export function lanternPose(age: number, seed: number, reduced = false,out:{position:Vec3;rotation:number;scale:number}={position:[0,0,0],rotation:0,scale:1}) {
  const seconds = Math.max(0, age) / 1000;
  const rise = Math.min(1, Math.max(0, age) / LANTERN_RISE);
  const drift = Math.max(0, seconds - LANTERN_RISE / 1000);
  const phase = (seed % 997) * .031;
  const spread = 1 - Math.exp(-drift * .18);
  const angle = drift * (.10 + (seed % 7) * .006) + phase;
  const radius = spread * (4 + (seed % 4) * .7);
  const fade = Math.max(0, Math.min(1, (LANTERN_LIFETIME - age) / 10000));
  out.position[0]=28+Math.cos(angle)*radius;
  out.position[1]=POND.waterY+.265+(7.35-(POND.waterY+.265))*(1-(1-rise)**2)+(reduced?0:Math.sin(drift*.6)*.25*spread);
  out.position[2]=35.5+Math.sin(angle)*radius*.48;
  out.rotation=reduced?0:Math.sin(seconds*.6+phase)*.12;
  out.scale=age<0||age>=LANTERN_LIFETIME?0:fade;
  return out;
}

export function floatingLotusPose(seconds:number,index:number,out:Vec3=[0,0,0]){
  const [x,z]=driftingLotusAnchors[index%driftingLotusAnchors.length],phase=seconds*.12+index*2.39996;
  out[0]=x+Math.cos(phase)*.18;out[1]=POND.waterY+.035+Math.sin(seconds*.65+index)*.015;out[2]=z+Math.sin(phase*.87)*.16;
  return out;
}

export function bellAngle(age:number, reduced=false) {
  if (reduced || age < 0 || age >= BELL_DURATION) return 0;
  return Math.sin(age / 1000 * 6) * .13 * (1 - age/BELL_DURATION)**2;
}
