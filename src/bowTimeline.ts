export type BowMode='standing'|'cushion';
export interface BowSession {at:number;mode:BowMode}
export const BOW={kneel:.95,down:1.1,hold:.55,up:1.15,settle:.25,rise:.8,strikeFraction:.85} as const;
export function bowDuration(mode:BowMode){return (mode==='standing'?BOW.kneel+BOW.rise:0)+BOW.down+BOW.hold+BOW.up+BOW.settle}
export function bowStrikeOffset(mode:BowMode){return (mode==='standing'?BOW.kneel:0)+BOW.down*BOW.strikeFraction}
const ease=(v:number)=>{const x=Math.min(1,Math.max(0,v));return x*x*(3-2*x)};
export interface BowFrame {kneel:number;bend:number;reach:number;done:boolean}
// Caller owns the output: no allocations or state updates per animation frame.
export function sampleBow(seconds:number,mode:BowMode,out:BowFrame){
  const lead=mode==='standing'?BOW.kneel:0,t=Math.max(0,seconds-lead),end=BOW.down+BOW.hold+BOW.up+BOW.settle;
  const down=ease(t/BOW.down),up=ease((t-BOW.down-BOW.hold)/BOW.up),amount=down*(1-up);
  out.kneel=mode==='standing'?ease(seconds/BOW.kneel)*(1-ease((t-end)/BOW.rise)):1;
  out.bend=amount*(mode==='cushion'?1.82:1.57);out.reach=ease((down-.12)/.76)*(1-ease((up-.35)/.65));out.done=seconds>=bowDuration(mode);return out;
}
