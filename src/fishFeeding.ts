import {POND,POND_BRIDGES} from './pondLayout';

export const FISH_FEED_LIFETIME=12000;
export function koiTarget(index:number,seconds:number,food:{x:number;z:number}|null,out:[number,number]=[0,0]){
  const phase=seconds*.20+index*2.399;
  out[0]=food?food.x+Math.cos(phase)*(.45+index%4*.23):POND.x+Math.cos(phase)*(3.5+index%4*.68);
  out[1]=food?food.z+Math.sin(phase)*(.48+index%3*.26):POND_BRIDGES[0].z-1+Math.sin(phase*.81)*(3.5+index%5*.92);
  return out;
}
