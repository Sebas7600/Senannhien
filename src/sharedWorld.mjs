import layout from './sharedWorldLayout.json' with {type:'json'};
import {createSharedLeaves,advanceLeaf,collectLeaf} from './sharedLeaves.mjs';
export const BELL_DURATION=6000,BELL_REST=10000,DRUM_DURATION=4200;
const near=(p,x,z,r)=>Math.hypot(p.x-x,p.z-z)<=r;
export function createSharedWorld(now){return {bell:null,drum:null,lanterns:[],gateOpen:true,waterJars:[0,0,0,0].map(()=>({units:0,at:now})),leafEpoch:now,leafRevision:0,leafSlots:createSharedLeaves(now),operations:new Map(),lastLantern:new Map()};}
export function gateSweep(p){return near(p,layout.gate.x,layout.gate.z,3.2);}
export function trackWorldPlayer(world,peer,body,now){
 const action=body.action,old=peer.waterTrip;
 if(action==='drawWater'&&near(peer,layout.water.well.x,layout.water.well.z,2.4)){peer.waterTrip=old&&peer.action==='drawWater'?old:{drawAt:now,ready:false,pourAt:0};}
 else if(old){
  if(action==='carryWater'&&now-old.drawAt>=3000){old.ready=true;old.pourAt=0;}
  else if(action==='pourWater'&&old.ready){if(peer.action!=='pourWater')old.pourAt=now;}
  else if(!['drawWater','carryWater','pourWater'].includes(action))peer.waterTrip=null;
 }
 if(!world.gateOpen&&gateSweep(peer))world.gateOpen=true;
}
export function sharedWorldSnapshot(world,now){
 for(const slot of world.leafSlots)advanceLeaf(slot,now);
 world.lanterns=world.lanterns.filter(l=>now-l.at<120000);
 for(const [key,value]of world.operations)if(now-value.at>650000)world.operations.delete(key);
 return {bell:world.bell,drum:world.drum,lanterns:world.lanterns,gateOpen:world.gateOpen,waterJars:world.waterJars,leaves:{epoch:world.leafEpoch,revision:world.leafRevision,cleared:world.leafSlots.filter(s=>s.collectedAt).map(s=>[s.seed,s.fallAt,s.collectedAt,s.gatherX,s.gatherZ])}};
}
export function worldAction(world,peers,peer,b,now){
 const key=peer.id+':'+b.operation,cached=world.operations.get(key);if(cached)return cached.result;
 const fail=(status,error,extra={})=>({status,error,...extra});let readyAt;
 if(b.kind==='bell'){
  if(!near(peer,layout.bell.x,layout.bell.z,7))return fail(409,'Đến gần lầu chuông rồi thử lại.');
  if(world.bell&&now<world.bell.readyAt)return fail(429,'Chuông đang ngân hoặc đang nghỉ.',{readyAt:world.bell.readyAt});
  readyAt=now+BELL_DURATION+BELL_REST;world.bell={at:now,endsAt:now+BELL_DURATION,readyAt,owner:peer.id};
 }else if(b.kind==='drum'){
  if(!near(peer,layout.drum.x,layout.drum.z+2.1,3))return fail(409,'Đến gần lầu trống rồi thử lại.');
  if(world.drum&&now<world.drum.at+DRUM_DURATION)return fail(429,'Đang có người đánh trống.');
  world.drum={at:now,owner:peer.id};
 }else if(b.kind==='lantern'){
  if(!near(peer,...layout.wish,4))return fail(409,'Đến đài hoa đăng rồi thử lại.');
  if(now-(world.lastLantern.get(peer.id)??-Infinity)<3000)return fail(429,'Đợi hoa đăng trước bay lên nhé.');
  const text=typeof b.text==='string'?b.text.trim().slice(0,160):'';
  world.lanterns.push({at:now,owner:peer.id,text});world.lanterns=world.lanterns.slice(-8);world.lastLantern.set(peer.id,now);
 }else if(b.kind==='gate'){
  if(!near(peer,layout.gate.x,layout.gate.z,6))return fail(409,'Đến gần cổng rồi thử lại.');
  if(typeof b.open!=='boolean')return fail(400,'Cổng không hợp lệ.');
  if(!b.open&&[...peers.values()].some(gateSweep))return fail(409,'Còn người trong khoảng xoay của cổng.');
  world.gateOpen=b.open;
 }else if(b.kind==='water'){
  const jar=layout.water.jars[b.jar],trip=peer.waterTrip;
  if(!Number.isInteger(b.jar)||!jar||!near(peer,jar.x,jar.z,2.4)||peer.z>jar.z-.35)return fail(409,'Đến gần miệng lu rồi thử lại.');
  if(!trip?.ready||peer.action!=='pourWater'||!trip.pourAt||now-trip.pourAt<2200)return fail(409,'Hoàn tất lấy nước và rót nước trước nhé.');
  const old=world.waterJars[b.jar],units=Math.max(0,old.units-Math.floor(Math.max(0,now-old.at)/180000));
  if(units>=4)return fail(409,'Lu đã đầy. Mời chọn lu khác.');
  world.waterJars[b.jar]={units:units+1,at:now};peer.waterTrip=null;
 }else return fail(400,'Hoạt động không hợp lệ.');
 const result={status:200,at:now,serverTime:now,...(readyAt?{readyAt}:{})};world.operations.set(key,{at:now,result});return result;
}
export function sweepLeaves(world,peer,b,now){
 const key=peer.id+':'+b.operation,cached=world.operations.get(key);if(cached)return cached.result;
 const c=b.contact,finite=c&&['fromX','fromZ','x','z','ground','radius','forwardX','forwardZ','depthScale'].every(k=>typeof c[k]==='number'&&Number.isFinite(c[k]));
 if(peer.action!=='sweep'||!finite||!Array.isArray(b.seeds)||b.seeds.length>40||c.radius<.1||c.radius>.4||c.depthScale<.5||c.depthScale>1||Math.abs(Math.hypot(c.forwardX,c.forwardZ)-1)>.05||Math.hypot(c.x-peer.x,c.z-peer.z)>1.4||Math.hypot(c.fromX-c.x,c.fromZ-c.z)>.5||Math.abs(c.ground-peer.y)>.25)return {status:409,error:'Đến gần lá rồi quét bằng chổi nhé.'};
 let count=0;for(const seed of new Set(b.seeds)){
  const slot=world.leafSlots.find(s=>s.seed===seed);if(!slot)continue;advanceLeaf(slot,now);if(collectLeaf(slot,now,c))count++;
 }
 if(count)world.leafRevision++;
 const result={status:200,count,at:now};world.operations.set(key,{at:now,result});return result;
}
