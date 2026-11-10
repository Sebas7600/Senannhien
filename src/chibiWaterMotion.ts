import {Vector3,Quaternion} from 'three';
const axis=new Vector3(1,0,0),ease=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export interface ChibiWaterFrame{position:Vector3;rotation:Quaternion;rightGrip:Vector3;leftGrip:Vector3;lip:Vector3;scale:number;fill:number;flow:boolean;bend:number;headPitch:number;headBack:number}
export const createChibiWaterFrame=():ChibiWaterFrame=>({position:new Vector3(),rotation:new Quaternion(),rightGrip:new Vector3(),leftGrip:new Vector3(),lip:new Vector3(),scale:.62,fill:0,flow:false,bend:0,headPitch:0,headBack:0});
/** One frame drives the bucket, its two hand targets, water fill and pouring stream. */
export function sampleChibiWater(pose:'drawWater'|'pourWater',progress:number,out:ChibiWaterFrame){
 const p=Math.max(0,Math.min(1,progress)),pour=pose==='pourWater',lift=pour?ease(p/.35)*(1-ease((p-.90)/.10)):0;
 const pull=pour?0:ease(p),tilt=pour?.70*ease((p-.28)/.32)*(1-ease((p-.90)/.10)):0;
 out.position.set(-.025*(1-lift),.52+.555*lift+.055*pull,.23-.04*lift+.03*Math.sin(Math.PI*lift));out.rotation.setFromAxisAngle(axis,tilt);
 out.rightGrip.set(-.13*lift,.36*(1-lift)-.06*lift,.04*lift).multiplyScalar(out.scale).applyQuaternion(out.rotation).add(out.position);
 out.leftGrip.set(.15-.02*lift,.18*(1-lift)-.06*lift,.04).multiplyScalar(out.scale).applyQuaternion(out.rotation).add(out.position);
 out.lip.set(0,.30,.16).multiplyScalar(out.scale).applyQuaternion(out.rotation).add(out.position);
 out.fill=pour?1-ease((p-.35)/.45):ease(p);out.flow=pour&&p>.38&&p<.85;out.bend=pour?.035*lift:.055*(1-pull);out.headBack=pour?.05*ease(p/.14)*(1-ease((p-.90)/.10)):0;out.headPitch=pour?-15*out.headBack:.12;return out;
}
