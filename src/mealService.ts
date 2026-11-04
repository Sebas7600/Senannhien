import {distance,npcs,seats,seatExit,KITCHEN_PICKUP,type Vec2} from './gameData';
import {findPath} from './navigation';

export const PREPARE_MS=4200;
export const PICKUP_MS=700;
export const HANDOFF_MS=550;
export const SERVICE_SPEED=2.6;
export type ServicePhase='toKitchen'|'waiting'|'pickup'|'delivering'|'handoff'|'returning'|'idle';
export interface ServiceTimes {orderedAt?:number;cookedAt?:number;kitchenAt?:number;deliveryAt?:number;readyAt:number;homeAt?:number}
export interface Route {points:Vec2[];lengths:number[];length:number}
function makeRoute(start:Vec2,end:Vec2):Route {
  const points=[start,...findPath(start,end)];
  const lengths=points.slice(1).map((p,i)=>distance(points[i],p));
  return {points,lengths,length:lengths.reduce((a,b)=>a+b,0)};
}
const plans=new Map<string,ReturnType<typeof buildPlan>>();
function buildPlan(seatId:string){
  const cook=npcs.find(n=>n.id==='cook')!,seat=seats.find(s=>s.id===seatId);
  const home:Vec2=[cook.x,cook.z],destination=seat?seatExit(seat):home;
  return {toKitchen:makeRoute(home,KITCHEN_PICKUP),toTable:makeRoute(KITCHEN_PICKUP,destination),toReception:makeRoute(destination,home)};
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
