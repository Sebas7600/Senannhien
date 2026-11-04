import {createStore} from 'zustand/vanilla';
import {GATE,gateLeafPose} from './courtyardPropsData';
export const gateState=createStore(()=>({open:true}));
export function gateBlocked(x:number,z:number,margin:number){
  const open=gateState.getState().open?1:0;
  for(const side of [-1,1] as const){const p=gateLeafPose(side,open),dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle);if(Math.abs(c*dx-s*dz)<GATE.leafWidth*GATE.scale/2+margin&&Math.abs(s*dx+c*dz)<.16*GATE.scale+margin)return true;}
  return false;
}
