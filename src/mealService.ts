import {distance,npcs,seats,walkable,KITCHEN_PICKUP,PICKUP_PLATE,type Vec2,type Vec3} from './gameData';
import {findPath} from './navigation';

export const PREPARE_MS=4200;
export const PICKUP_MS=700;
export const HANDOFF_MS=2400;
export const TURN_MS=450;
export const WITHDRAW_MS=600;
export const MEAL_SCALE=.75;
// The serving tray extends .0675 below the food origin; its underside rests on the table.
export const PLATE_LIFT=.0675*MEAL_SCALE;
export const SERVICE_SPEED=2.6;
export type ServicePhase='toKitchen'|'waiting'|'pickup'|'delivering'|'handoff'|'returning'|'idle';
export interface ServiceTimes {orderedAt?:number;cookedAt?:number;kitchenAt?:number;deliveryAt?:number;readyAt:number;homeAt?:number}
export interface Route {points:Vec2[];lengths:number[];length:number}
const diningSeats=seats.filter(s=>s.kind==='dining');
export function serviceWalkable(x:number,z:number){return walkable(x,z)&&diningSeats.every(s=>Math.hypot(s.position[0]-x,s.position[2]-z)>=.95);}
function makeRoute(start:Vec2,end:Vec2):Route {
  const points=[start,...findPath(start,end,serviceWalkable)];
  const lengths=points.slice(1).map((p,i)=>distance(points[i],p));
  return {points,lengths,length:lengths.reduce((a,b)=>a+b,0)};
}
const plans=new Map<string,ReturnType<typeof buildPlan>>();
function buildPlan(seatId:string){
  const cook=npcs.find(n=>n.id==='cook')!,seat=seats.find(s=>s.id===seatId);
  const home:Vec2=[cook.x,cook.z],table=seat?.table;
  const sideX=seat&&table&&seat.position[0]<table[0]?-1:1,sideZ=seat&&table&&seat.position[2]<table[2]?-1:1;
  // Serve from an end of the table, not through either seated diner on its long side.
  const destination:Vec2=table?[table[0]+sideX*.65,table[2]+sideZ*1.94]:home;
  const plate:Vec3=table?[table[0]+sideX*.65,table[1]+PLATE_LIFT,table[2]+sideZ]:[home[0],.7,home[1]];
  return {destination,plate,heading:sideZ<0?0:Math.PI,toKitchen:makeRoute(home,KITCHEN_PICKUP),toTable:makeRoute(KITCHEN_PICKUP,destination),toReception:makeRoute(destination,home)};
}
export function mealPlan(seatId:string){let plan=plans.get(seatId);if(!plan){plan=buildPlan(seatId);plans.set(seatId,plan);}return plan;}
export function mealRoute(seatId:string){return mealPlan(seatId).toTable;}
export function serviceTimes(seatId:string,orderedAt:number){
  const plan=mealPlan(seatId),cookedAt=orderedAt+PREPARE_MS;
  const kitchenAt=orderedAt+Math.ceil(plan.toKitchen.length/SERVICE_SPEED*1000);
  const deliveryAt=Math.max(cookedAt,kitchenAt)+PICKUP_MS;
  const readyAt=deliveryAt+Math.ceil(plan.toTable.length/SERVICE_SPEED*1000)+HANDOFF_MS;
  return {orderedAt,cookedAt,kitchenAt,deliveryAt,readyAt,homeAt:readyAt+Math.ceil(plan.toReception.length/SERVICE_SPEED*1000)};
}
export function servicePhase(order:ServiceTimes,now:number):ServicePhase {
  if(order.orderedAt===undefined||order.deliveryAt===undefined||order.kitchenAt===undefined)return 'idle';
  if(now<order.kitchenAt)return 'toKitchen';
  if(now<Math.max(order.cookedAt??0,order.kitchenAt))return 'waiting';
  if(now<order.deliveryAt)return 'pickup';
  if(now<order.readyAt-HANDOFF_MS)return 'delivering';
  if(now<order.readyAt)return 'handoff';
  if(now<(order.homeAt??order.readyAt))return 'returning';
  return 'idle';
}
export function counterHasMeal(order:ServiceTimes|null,now:number){return !!order&&order.cookedAt!==undefined&&now>=order.cookedAt&&now<(order.deliveryAt??0);}
const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export interface ServeFrame {handX:number;handY:number;handZ:number;bend:number;hips:number;release:number}
export interface MealPresentation {visible:boolean;position:Vec3;heading:number;hands:ServeFrame}
export function createMealPresentation():MealPresentation{return {visible:false,position:[0,0,0],heading:0,hands:{handX:0,handY:.9,handZ:.6,bend:0,hips:.84,release:0}}}
/** One plate follows counter -> hands -> tabletop, without replacing or rescaling its mesh. */
export function sampleMealPresentation(order:ServiceTimes&{seatId:string;status:string},now:number,npc:{x:number;y:number;z:number;heading:number},out:MealPresentation){
  const plan=mealPlan(order.seatId),phase=servicePhase(order,now),p=out.position,h=out.hands;
  const sin=Math.sin(npc.heading),cos=Math.cos(npc.heading),carryX=npc.x+sin*.6,carryY=npc.y+.9+PLATE_LIFT+.018,carryZ=npc.z+cos*.6;
  const elapsed=now-(order.readyAt-HANDOFF_MS),reach=ease((elapsed-TURN_MS)/(HANDOFF_MS-TURN_MS-WITHDRAW_MS)),release=ease((elapsed-(HANDOFF_MS-WITHDRAW_MS))/WITHDRAW_MS);
  out.visible=order.status!=='finished'&&(order.cookedAt===undefined?order.status==='ready'||order.status==='eating':now>=order.cookedAt);
  p[0]=carryX;p[1]=carryY;p[2]=carryZ;out.heading=npc.heading;
  h.bend=0;h.release=0;
  if(order.status==='ready'||order.status==='eating'||now>=order.readyAt-WITHDRAW_MS){p[0]=plan.plate[0];p[1]=plan.plate[1];p[2]=plan.plate[2];out.heading=plan.heading;}
  else if(phase==='toKitchen'||phase==='waiting'){
    p[0]=PICKUP_PLATE[0];p[1]=1.47+PLATE_LIFT;p[2]=PICKUP_PLATE[2];out.heading=0;
  }else if(phase==='pickup'){
    const pickupStart=Math.max(order.cookedAt??0,order.kitchenAt??0),t=ease((now-pickupStart)/PICKUP_MS);
    p[0]=mix(PICKUP_PLATE[0],carryX,t);p[1]=mix(1.47+PLATE_LIFT,carryY,t)+Math.sin(Math.PI*t)*.08;p[2]=mix(PICKUP_PLATE[2],carryZ,t);
    out.heading=npc.heading*t;h.bend=.20*(1-t);
  }else if(phase==='handoff'){
    p[0]=mix(carryX,plan.plate[0],reach);p[1]=mix(carryY,plan.plate[1],reach)+Math.sin(Math.PI*reach)*.08;p[2]=mix(carryZ,plan.plate[2],reach);
  }
  if(phase==='handoff'){h.bend=.52*reach*(1-release);h.release=release;}
  h.hips=.84-h.bend*.27;
  const dx=p[0]-npc.x,dz=p[2]-npc.z;
  h.handX=mix(dx*cos-dz*sin,0,h.release);h.handY=mix(p[1]-npc.y-PLATE_LIFT-.018,.72,h.release);h.handZ=mix(dx*sin+dz*cos,.03,h.release);
  return out;
}
export function sampleRoute(route:Route,progress:number,out:{x:number;z:number;heading:number}){
  let remaining=route.length*Math.max(0,Math.min(1,progress));
  for(let i=0;i<route.lengths.length;i++){
    const length=route.lengths[i];
    if(remaining<=length||i===route.lengths.length-1){const a=route.points[i],b=route.points[i+1],t=length?Math.min(1,remaining/length):1;out.x=a[0]+(b[0]-a[0])*t;out.z=a[1]+(b[1]-a[1])*t;out.heading=Math.atan2(b[0]-a[0],b[1]-a[1]);return out;}
    remaining-=length;
  }
  out.x=route.points[0][0];out.z=route.points[0][1];out.heading=-Math.PI/2;return out;
}
export function routePoint(points:Vec2[],progress:number):{position:Vec2;heading:number}{
  const lengths=points.slice(1).map((p,i)=>distance(points[i],p));
  const out=sampleRoute({points,lengths,length:lengths.reduce((a,b)=>a+b,0)},progress,{x:0,z:0,heading:0});
  return {position:[out.x,out.z],heading:out.heading};
}
export const serviceLabels:Record<ServicePhase,string>={toKitchen:'Cô Tâm đang vào bếp',waiting:'Bếp đang hoàn thiện món',pickup:'Cô Tâm đang nhận món',delivering:'Cô Tâm đang mang món đến',handoff:'Cô Tâm đang đặt món lên bàn',returning:'Cô Tâm đang về quầy đón khách',idle:'Món đã sẵn sàng'};
