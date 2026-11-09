import {DRUM_PROP} from './courtyardPropsData';
export const DRUM_STRIKES=[650,1850,3050] as const;
export const DRUM_DURATION=4200;
export const DRUM_APPROACH:[number,number]=[DRUM_PROP.x,DRUM_PROP.z+2.1];
const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function drumStroke(ms:number){
  let amount=0;
  for(const at of DRUM_STRIKES)amount=Math.max(amount,ease((ms-at+300)/300)*(1-ease((ms-at)/500)));
  return amount;
}
export function drumBeats(ms:number){return DRUM_STRIKES.filter(at=>ms>=at).length;}
