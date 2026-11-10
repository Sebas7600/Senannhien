import {POND,ISLAND,pondBoundary,pondContains} from './pondScene.mjs';
export {FISH_FEED_LIFETIME,foodIsActive} from './pondScene.mjs';
const random=(seed)=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n)};
function patrolPoint(index,knot,out){
 const angle=random(index*71+knot*17+1)*Math.PI*2;
 const [x,z]=pondBoundary(angle,-1.6),r=.58+random(index*113+knot*13+7)*.35;
 out[0]=POND.x+(x-POND.x)*r;out[1]=POND.z+(z-POND.z)*r;
}
/** Independent seeded destinations, with smooth transitions and varied dwell times. */
export function koiTarget(index,seconds,food,out=[0,0]){
 if(food){
  const phase=seconds*(.62+index%3*.07)*(index%2?1:-1)+index*2.399;
  const radius=.55+random(index+5)*.55;
  out[0]=food.x+Math.cos(phase)*radius;out[1]=food.z+Math.sin(phase)*radius*.88;
 }else{
  const time=seconds/(18+index%5*3)+random(index+29)*9,knot=Math.floor(time),t=time-knot,blend=t*t*(3-2*t);
  patrolPoint(index,knot,out);const x=out[0],z=out[1];patrolPoint(index,knot+1,out);
  out[0]=x+(out[0]-x)*blend;out[1]=z+(out[1]-z)*blend;
  const dx=out[0]-ISLAND.x,dz=out[1]-ISLAND.z,d=Math.hypot(dx,dz),r=ISLAND.radius+.9;
  if(d<r){out[0]=ISLAND.x+(dx/(d||1))*r;out[1]=ISLAND.z+(dz/(d||1))*r;}
 }
 return out;
}
/** Tangential island avoidance, without teleporting fish through land. */
export function steerKoi(x,z,tx,tz,step,out=[0,0]){
 const radius=ISLAND.radius+.65,dx=tx-x,dz=tz-z,length2=dx*dx+dz*dz;
 const t=length2?Math.max(0,Math.min(1,((ISLAND.x-x)*dx+(ISLAND.z-z)*dz)/length2)):0;
 if(Math.hypot(x+dx*t-ISLAND.x,z+dz*t-ISLAND.z)<radius){
  const a=Math.atan2(z-ISLAND.z,x-ISLAND.x),b=Math.atan2(tz-ISLAND.z,tx-ISLAND.x);
  const delta=Math.atan2(Math.sin(b-a),Math.cos(b-a)),next=a+Math.sign(delta||1)*.26;
  tx=ISLAND.x+Math.cos(next)*(radius+.35);tz=ISLAND.z+Math.sin(next)*(radius+.35);
 }
 const distance=Math.hypot(tx-x,tz-z),move=Math.min(distance,step);
 out[0]=x+(distance?(tx-x)/distance*move:0);out[1]=z+(distance?(tz-z)/distance*move:0);
 if(!pondContains(out[0],out[1],-.45)){out[0]=x;out[1]=z;}
 return out;
}
