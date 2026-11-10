import {koiTarget,steerKoi} from './fishMotion.mjs';
import {POND,foodIsActive} from './pondScene.mjs';
export const FISH_COUNT=23;
const STEP=1000/30,damp=(a,b,k,dt)=>b+(a-b)*Math.exp(-k*dt);
export function createFishSchool(at){
 const poses=[],states=[];
 // Preserve the scattered arrival view; subsequent destinations remain independent.
 for(let i=0;i<FISH_COUNT;i++){
  const angle=i*2.399963,spread=.58+i%4*.085;
  const x=POND.x+Math.cos(angle)*POND.rx*spread,z=POND.z+Math.sin(angle)*POND.rz*spread;
  poses.push(x,z,angle);states.push({x,z,at:0,blend:0,speed:.65,feedAt:null,eating:false});
 }
 return {at,epoch:at,poses,states};
}
// Reserve at most a third of the school for each pile. Keep some fish roaming
// so another visitor can attract a separate group without stealing arrivals.
function reserveMeals(school,active){
 const ids=new Set(active.map(f=>f.at)),load=new Map(active.map(f=>[f.at,0])),capacity=Math.ceil(FISH_COUNT/3);
 for(const a of school.states){if(a.feedAt!==null&&!ids.has(a.feedAt)){a.feedAt=null;a.eating=false;}if(a.feedAt!==null)load.set(a.feedAt,load.get(a.feedAt)+1);}
 const choices=[];
 for(let i=0;i<FISH_COUNT;i++)if(school.states[i].feedAt===null)for(const f of active)if(load.get(f.at)<capacity)choices.push({i,f,d:Math.hypot(school.poses[i*3]-f.x,school.poses[i*3+1]-f.z)});
 choices.sort((a,b)=>a.d-b.d||a.i-b.i||a.f.at-b.f.at);
 for(const {i,f}of choices)if(school.states[i].feedAt===null&&load.get(f.at)<capacity){school.states[i].feedAt=f.at;school.states[i].eating=false;load.set(f.at,load.get(f.at)+1);}
}
export function advanceFishSchool(school,now,foods){
 // Sleeping/empty rooms resume gently instead of running unbounded catch-up loops.
 if(now-school.at>2000)school.at=now-2000;
 while(school.at+STEP<=now){
  school.at+=STEP;const dt=STEP/1000,time=(school.at-school.epoch)/1000,active=foods.filter(f=>f.at<=school.at&&foodIsActive(f,school.at));
  reserveMeals(school,active);
  for(let i=0;i<FISH_COUNT;i++){
   const a=school.states[i],current=active.find(f=>f.at===a.feedAt);
   // Reservations survive newer throws, including the trip toward the food.
   const feed=current??null;
   if(feed){a.x=feed.x;a.z=feed.z;a.at=feed.at;}
   a.blend=damp(a.blend,feed?1:0,feed?2.2:.22,dt);a.speed=damp(a.speed,feed?(a.eating?1.45:2.8):.52+i%5*.065,feed?2.4:.3,dt);
   const normal=koiTarget(i,time,null),eating=koiTarget(i,time,a),tx=normal[0]+(eating[0]-normal[0])*a.blend,tz=normal[1]+(eating[1]-normal[1])*a.blend;
   const n=i*3,x0=school.poses[n],z0=school.poses[n+1],[x,z]=steerKoi(x0,z0,tx,tz,a.speed*dt);
   const yaw=school.poses[n+2],desired=Math.hypot(x-x0,z-z0)>.001?Math.atan2(x-x0,z-z0):yaw;
   school.poses[n]=x;school.poses[n+1]=z;school.poses[n+2]=yaw+Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw))*Math.min(1,dt*3);
   // Only the authoritative simulation can start the 18-second meal timer.
   if(feed&&Math.hypot(x-feed.x,z-feed.z)<1.35){a.eating=true;if(feed.eatingAt==null)feed.eatingAt=school.at;}
  }
 }
 return school;
}
export function fishSnapshot(school){return {at:school.at,seconds:(school.at-school.epoch)/1000,poses:school.poses.slice()};}
