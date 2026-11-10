import {Vector3,Quaternion} from 'three';
import type {BroomContact} from './leafSimulation';
export const SWEEP={periodMs:1500,headForward:.57,sideReach:.28,headRadius:.28,headDepth:.41,lowerGrip:.84,upperGrip:1.10,upperArm:.31,forearm:.30,maxSegment:.45} as const;
export interface SweepPose{base:Vector3;axis:Vector3;rotation:Quaternion;lowerGrip:Vector3;upperGrip:Vector3;side:number;headFlexX:number;headFlexZ:number}
export const createSweepPose=():SweepPose=>({base:new Vector3(),axis:new Vector3(),rotation:new Quaternion(),lowerGrip:new Vector3(),upperGrip:new Vector3(),side:1,headFlexX:0,headFlexZ:0});
const up=new Vector3(0,1,0);
const broomYaw=new Quaternion().setFromAxisAngle(up,Math.PI/2);
export const sweepContact={at:0,side:1,strength:0,ready:false};
/** One shared pose drives the prop, the two hand targets and ground contact. No allocations per frame. */
export function sampleSweepPose(now:number,reduced:boolean,out:SweepPose,contact:typeof sweepContact|null=null){
 const phase=now/SWEEP.periodMs*Math.PI*2,stroke=Math.sin(phase),x=.20+stroke*SWEEP.sideReach;out.axis.set(-x*.64,.95,-.27).normalize();out.base.set(x,.015+.055*Math.abs(out.axis.x)+.16*Math.abs(out.axis.z),SWEEP.headForward+.025*Math.cos(phase*2));out.rotation.setFromUnitVectors(up,out.axis).multiply(broomYaw);out.lowerGrip.copy(out.axis).multiplyScalar(SWEEP.lowerGrip).add(out.base);out.upperGrip.copy(out.axis).multiplyScalar(SWEEP.upperGrip).add(out.base);out.side=Math.cos(phase)>=0?1:-1;
 applyHeadFlex(now,reduced,stroke,out,contact);return out;
}
function applyHeadFlex(now:number,reduced:boolean,stroke:number,out:SweepPose,contact:typeof sweepContact|null){
 const age=contact?(now-contact.at)/1000:10,pulse=contact&&age>=0&&age<.65?Math.sin(age*32)*Math.exp(-age*8)*contact.strength*contact.side:0;
 out.headFlexX=reduced?0:stroke*.018+pulse*.055;out.headFlexZ=reduced?0:-stroke*.035+pulse*.15;
}
export const CHIBI_SWEEP={headForward:.43,sideReach:.17,baseHeight:-.011,lowerGrip:.66,upperGrip:.82,modelScaleX:1.08,modelScaleZ:1.10} as const;
/** The short chibi forearms need a lower, closer grip than the original adult rig. */
export function sampleChibiSweepPose(now:number,reduced:boolean,out:SweepPose,contact:typeof sweepContact|null=null,visualOffset=.025){
 const phase=now/SWEEP.periodMs*Math.PI*2,stroke=Math.sin(phase),x=.08+stroke*CHIBI_SWEEP.sideReach,z=CHIBI_SWEEP.headForward+.02*Math.cos(phase*2);
 // Aim the shaft through the space between both shoulders, not out past the right arm.
 out.axis.set(-x,.72,.22-z).normalize();
 out.base.set(x,CHIBI_SWEEP.baseHeight+.055*Math.abs(out.axis.x)+.16*Math.abs(out.axis.z)+visualOffset,z);
 out.rotation.setFromUnitVectors(up,out.axis).multiply(broomYaw);
 out.lowerGrip.copy(out.axis).multiplyScalar(CHIBI_SWEEP.lowerGrip).add(out.base);
 out.upperGrip.copy(out.axis).multiplyScalar(CHIBI_SWEEP.upperGrip).add(out.base);out.side=Math.cos(phase)>=0?1:-1;applyHeadFlex(now,reduced,stroke,out,contact);return out;
}
/** Prop space is outside the scaled GLB; convert its grip into the rig's model space. */
export function chibiSweepGrip(frame:SweepPose,side:'L'|'R',out:Vector3){
 out.copy(side==='L'?frame.upperGrip:frame.lowerGrip);out.x/=CHIBI_SWEEP.modelScaleX;out.z/=CHIBI_SWEEP.modelScaleZ;return out;
}
/** Two fixed-length links, with an outward elbow pole. Targets stay inside the reachable envelope. */
export function sweepElbow(shoulder:Vector3,wrist:Vector3,side:number,out:Vector3,direction:Vector3,pole:Vector3){
 direction.copy(wrist).sub(shoulder);const d=Math.min(SWEEP.upperArm+SWEEP.forearm-.0001,Math.max(.001,direction.length()));direction.normalize();pole.set(side*.9,-.35,-.45).addScaledVector(direction,-pole.dot(direction)).normalize();const a=(SWEEP.upperArm**2-SWEEP.forearm**2+d*d)/(2*d),h=Math.sqrt(Math.max(0,SWEEP.upperArm**2-a*a));return out.copy(shoulder).addScaledVector(direction,a).addScaledVector(pole,h);
}
export interface PreviousBroomContact{x:number;z:number;valid:boolean}
export function createBroomContact():BroomContact{
 return {x:0,z:0,fromX:0,fromZ:0,ground:0,radius:SWEEP.headRadius,forwardX:0,forwardZ:1,depthScale:SWEEP.headRadius/SWEEP.headDepth};
}
export function placeSweepContact(pose:SweepPose,x:number,z:number,ground:number,heading:number,previous:PreviousBroomContact,elapsed:number,out:BroomContact){
 const c=Math.cos(heading),s=Math.sin(heading),cx=x+c*pose.base.x+s*pose.base.z,cz=z-s*pose.base.x+c*pose.base.z,valid=previous.valid&&elapsed<150&&Math.hypot(cx-previous.x,cz-previous.z)<SWEEP.maxSegment;
 out.x=cx;out.z=cz;out.fromX=valid?previous.x:cx;out.fromZ=valid?previous.z:cz;out.ground=ground;
 out.forwardX=s;out.forwardZ=c;previous.x=cx;previous.z=cz;previous.valid=true;return out;
}
