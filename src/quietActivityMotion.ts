export interface QuietActivityFrame {sip:number;cupTilt:number;page:number;turnHand:number;breath:number}
export const createQuietActivityFrame=():QuietActivityFrame=>({sip:0,cupTilt:0,page:0,turnHand:0,breath:0});
const ease=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};

// A pause before and after each gesture keeps the motions unhurried. Reuse the
// caller's frame: no React updates, timers or allocations in the animation loop.
export function sampleQuietActivity(pose:string,seconds:number,out:QuietActivityFrame,reduced=false){
  const t=Math.max(0,seconds);
  out.sip=out.cupTilt=out.page=out.turnHand=out.breath=0;
  if(reduced)return out;
  out.breath=Math.sin(t*1.3)*.004;
  if(pose==='tea'){
    const phase=t%7;
    out.sip=ease((phase-1)/1.5)*(1-ease((phase-4.1)/1.6));
    out.cupTilt=ease((phase-2.7)/.7)*(1-ease((phase-3.8)/.7))*.24;
  }else if(pose==='read'){
    const phase=t%8;
    out.page=ease((phase-5.4)/1.2);
    out.turnHand=out.page*(1-ease((phase-6.6)/1));
  }
  return out;
}
