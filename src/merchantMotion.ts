import type {Merchant} from './merchantData';
export type MerchantMotion={sway:number;breath:number;right:number;left:number};
export function sampleMerchantMotion(merchant:Merchant,position:readonly number[],seconds:number,reduced:boolean,out:MerchantMotion){
 const dx=position[0]-merchant.x,dz=position[1]-merchant.z,distance=Math.hypot(dx,dz);
 if(reduced||distance>=18){out.sway=out.breath=out.right=out.left=0;return out;}
 const weight=Math.min(1,(18-distance)/4),t=seconds+merchant.phase,cycle=t%11,front=dx*Math.sin(merchant.heading)+dz*Math.cos(merchant.heading)>0;
 const greeting=front&&cycle>.8&&cycle<3.4?Math.sin((cycle-.8)/2.6*Math.PI)**2:0;
 out.sway=Math.sin(t*.64)*.009*weight;
 out.breath=(1+Math.sin(t*.91))*.0017*weight;
 out.right=-greeting*(.55+.08*Math.sin(t*7))*weight;
 out.left=Math.sin(t*.72)*.07*weight;
 return out;
}

export const merchantMotionAttributes=`
 attribute vec2 merchantArmWeight;
 attribute float merchantBodyMask;
 attribute vec4 merchantMotion;
 attribute vec4 merchantArmRotation;
 uniform vec3 merchantRightPivot;
 uniform vec3 merchantLeftPivot;
 vec3 merchantRotateX(vec3 v,vec2 rotation){return vec3(v.x,rotation.x*v.y-rotation.y*v.z,rotation.y*v.y+rotation.x*v.z);}
`;
export const merchantPositionMotion=`
 transformed=mix(transformed,merchantRightPivot+merchantRotateX(transformed-merchantRightPivot,merchantArmRotation.xy),merchantArmWeight.x*merchantBodyMask);
 transformed=mix(transformed,merchantLeftPivot+merchantRotateX(transformed-merchantLeftPivot,merchantArmRotation.zw),merchantArmWeight.y*merchantBodyMask);
 transformed.xy+=merchantMotion.xy*merchantBodyMask*smoothstep(.45,1.02,position.y);
`;
export const merchantNormalMotion=`
 objectNormal=mix(objectNormal,merchantRotateX(objectNormal,merchantArmRotation.xy),merchantArmWeight.x*merchantBodyMask);
 objectNormal=mix(objectNormal,merchantRotateX(objectNormal,merchantArmRotation.zw),merchantArmWeight.y*merchantBodyMask);
`;
