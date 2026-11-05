export const MALA_BEADS=27;
export const BEAD_STEP_MS=420;

function beadAtGrip(count:number){
  if(count<=0)return 0;
  const index=(count-1)%MALA_BEADS;
  return Math.floor((count-1)/MALA_BEADS)%2?MALA_BEADS-index:index+1;
}

export interface BeadMotion{offset:number;pull:number;direction:number}

export function sampleBeadMotion(count:number,elapsed:number,reduced:boolean,out:BeadMotion){
  const t=reduced?1:Math.max(0,Math.min(1,elapsed/BEAD_STEP_MS));
  const slide=Math.max(0,Math.min(1,(t-.12)/.55));
  const ease=slide*slide*(3-2*slide);
  const next=beadAtGrip(count),previous=beadAtGrip(count-1);
  out.offset=(previous+(next-previous)*ease)/(MALA_BEADS+1);
  out.pull=t>=1?0:Math.sin(Math.PI*t)**2;
  out.direction=Math.floor(Math.max(0,count-1)/MALA_BEADS)%2?-1:1;
  return out;
}
