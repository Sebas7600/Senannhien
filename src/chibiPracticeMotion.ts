import {sampleBow,type BowFrame,type BowMode} from './bowTimeline';
import {CUSHION} from './cushionData';
const ease=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export const CHIBI_PRAYER={spread:.052,height:.27,forward:.215} as const;
export interface ChibiBowFrame{kneel:number;hipY:number;hipZ:number;pitch:number;headPitch:number;contact:number;palmX:number;palmY:number;palmZ:number;footZ:number;footY:number;footPitch:number}
export const createChibiBowFrame=():ChibiBowFrame=>({kneel:0,hipY:.465,hipZ:0,pitch:0,headPitch:0,contact:0,palmX:.018,palmY:.735,palmZ:.215,footZ:-.012,footY:.062,footPitch:0});
/** Same audio/reward timeline; targets are calibrated to the chibi's actual limb lengths. */
export function sampleChibiBow(seconds:number,mode:BowMode,out:ChibiBowFrame,timeline:BowFrame,standingHip=.465){
 sampleBow(seconds,mode,timeline);const seated=mode==='cushion',amount=timeline.bend/(seated?1.82:1.57),support=ease((amount-.30)/.70);
 // A seated bow is supported by the cushion top, never by the floor underneath it.
 // Keep the pelvis seated and limit the large chibi head's arc above that surface.
 const surface=seated?CUSHION.height-CUSHION.seatLift:0;
 out.kneel=timeline.kneel;out.hipY=seated?.078:standingHip+(.19-standingHip)*timeline.kneel;out.hipZ=seated?0:-.12*timeline.kneel;
 out.pitch=amount*(seated?1.21:1.40);out.headPitch=amount*.06;out.contact=support;
 out.palmX=CHIBI_PRAYER.spread+(.14-CHIBI_PRAYER.spread)*support;
 out.palmY=(out.hipY+CHIBI_PRAYER.height)*(1-support)+((seated?.006:.032)+surface)*support;
 out.palmZ=CHIBI_PRAYER.forward+((seated?.46:.43)-CHIBI_PRAYER.forward)*support;
 // Fold toes backwards in the sagittal plane. Yawing 180 degrees made each shoe
 // sweep sideways; the support envelope also keeps the toe above the ground.
 out.footPitch=Math.PI*timeline.kneel;
 const cos=Math.cos(out.footPitch),sin=Math.sin(out.footPitch);
 out.footY=.006+.056*Math.max(0,cos)+.063*Math.max(0,-cos)+.124*sin;
 out.footZ=-.012-.088*timeline.kneel;return out;
}
