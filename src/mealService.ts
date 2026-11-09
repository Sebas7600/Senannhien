import {distance,npcs,seats,walkable,KITCHEN_PICKUP,PICKUP_PLATE,KITCHEN_COUNTER_TOP,CHEF_HOME,CHEF_PASS,type Vec2,type Vec3} from './gameData';
import {findPath} from './navigation';

export const PREPARE_MS=3000;
export const CHEF_LIFT_MS=700;
export const CHEF_TURN_MS=350;
export const CHEF_SETDOWN_MS=1100;
export const CHEF_WITHDRAW_MS=450;
export const PICKUP_MS=700;
export const HANDOFF_MS=2400;
export const TURN_MS=450;
export const WITHDRAW_MS=600;
export const MEAL_SCALE=.75;
// The serving tray extends .0675 below the food origin; its underside rests on the table.
export const PLATE_LIFT=.0675*MEAL_SCALE;
export const SERVICE_SPEED=2.6;
export type ServicePhase='toKitchen'|'waiting'|'pickup'|'delivering'|'handoff'|'returning'|'idle';
export interface ServiceTimes {orderedAt?:number;cookedAt?:number;counterReadyAt?:number;kitchenAt?:number;deliveryAt?:number;readyAt:number;homeAt?:number}
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
let kitchenRoutes:{toPass:Route;toStove:Route;duration:number}|undefined;
export function chefRoutes(){return kitchenRoutes??=(function(){const toPass=makeRoute(CHEF_HOME,CHEF_PASS),toStove=makeRoute(CHEF_PASS,CHEF_HOME);return {toPass,toStove,duration:Math.ceil(toPass.length/SERVICE_SPEED*1000)}})();}
interface ChefSchedule {liftedAt:number;departAt:number;arriveAt:number;counterReadyAt:number;withdrawnAt:number;returnAt:number;stoveAt:number;homeAt:number}
const chefSchedules=new Map<number,ChefSchedule>();
export function chefSchedule(cookedAt:number){const cached=chefSchedules.get(cookedAt);if(cached)return cached;const r=chefRoutes(),liftedAt=cookedAt+CHEF_LIFT_MS,departAt=liftedAt+CHEF_TURN_MS,arriveAt=departAt+r.duration,counterReadyAt=arriveAt+CHEF_SETDOWN_MS,withdrawnAt=counterReadyAt+CHEF_WITHDRAW_MS,returnAt=withdrawnAt+CHEF_TURN_MS,stoveAt=returnAt+r.duration,result={liftedAt,departAt,arriveAt,counterReadyAt,withdrawnAt,returnAt,stoveAt,homeAt:stoveAt+CHEF_TURN_MS};if(chefSchedules.size>=8)chefSchedules.delete(chefSchedules.keys().next().value!);chefSchedules.set(cookedAt,result);return result;}
export function counterAvailableAt(order:ServiceTimes){return order.counterReadyAt===undefined?order.cookedAt??0:order.counterReadyAt+CHEF_WITHDRAW_MS;}
export function serviceTimes(seatId:string,orderedAt:number){
  const plan=mealPlan(seatId),cookedAt=orderedAt+PREPARE_MS,counterReadyAt=chefSchedule(cookedAt).counterReadyAt;
  const kitchenAt=orderedAt+Math.ceil(plan.toKitchen.length/SERVICE_SPEED*1000);
  const deliveryAt=Math.max(counterReadyAt+CHEF_WITHDRAW_MS,kitchenAt)+PICKUP_MS;
  const readyAt=deliveryAt+Math.ceil(plan.toTable.length/SERVICE_SPEED*1000)+HANDOFF_MS;
  return {orderedAt,cookedAt,counterReadyAt,kitchenAt,deliveryAt,readyAt,homeAt:readyAt+Math.ceil(plan.toReception.length/SERVICE_SPEED*1000)};
}
export function servicePhase(order:ServiceTimes,now:number):ServicePhase {
  if(order.orderedAt===undefined||order.deliveryAt===undefined||order.kitchenAt===undefined)return 'idle';
  if(now<order.kitchenAt)return 'toKitchen';
  if(now<Math.max(counterAvailableAt(order),order.kitchenAt))return 'waiting';
  if(now<order.deliveryAt)return 'pickup';
  if(now<order.readyAt-HANDOFF_MS)return 'delivering';
  if(now<order.readyAt)return 'handoff';
  if(now<(order.homeAt??order.readyAt))return 'returning';
  return 'idle';
}
export function counterHasMeal(order:ServiceTimes|null,now:number){return !!order&&order.cookedAt!==undefined&&now>=(order.counterReadyAt??order.cookedAt)&&now<(order.deliveryAt??0);}
const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export interface ServeFrame {handX:number;handY:number;handZ:number;bend:number;hips:number;release:number}
export type ChefPhase='idle'|'cooking'|'lifting'|'turning'|'carrying'|'settingDown'|'withdrawing'|'returning';
export interface ChefMotion {x:number;y:number;z:number;heading:number;phase:ChefPhase;walking:boolean;carrying:boolean}
export interface MealPresentation {visible:boolean;position:Vec3;heading:number;hands:ServeFrame;kitchen:ChefMotion}
export function createMealPresentation():MealPresentation{return {visible:false,position:[0,0,0],heading:0,hands:{handX:0,handY:.9,handZ:.6,bend:0,hips:.84,release:0},kitchen:{x:CHEF_HOME[0],y:.16,z:CHEF_HOME[1],heading:0,phase:'idle',walking:false,carrying:false}}}
export function chefPhase(order:ServiceTimes|null,now:number):ChefPhase{
  if(!order||order.orderedAt===undefined||order.cookedAt===undefined||order.counterReadyAt===undefined||now<order.orderedAt)return 'idle';
  const s=chefSchedule(order.cookedAt);
  return now<order.cookedAt?'cooking':now<s.liftedAt?'lifting':now<s.departAt?'turning':now<s.arriveAt?'carrying':now<s.counterReadyAt?'settingDown':now<s.withdrawnAt?'withdrawing':now<s.homeAt?'returning':'idle';
}
export const chefLabels:Record<ChefPhase,string>={idle:'Trò chuyện · E',cooking:'Cô An đang nấu món · 3 giây',lifting:'Cô An đang hoàn thiện khay',turning:'Cô An đang mang món sang quầy',carrying:'Cô An đang mang món sang quầy',settingDown:'Cô An đang đặt món bên phải quầy',withdrawing:'Cô An đã chuẩn bị món xong',returning:'Cô An đang về bếp'};
/** The chef stays behind the counter; her path cannot cross the receptionist's pickup point. */
export function sampleKitchenMeal(order:ServiceTimes&{status:string},now:number,out:MealPresentation){
  const k=out.kitchen,p=out.position,h=out.hands,phase=chefPhase(order,now);k.x=CHEF_HOME[0];k.y=.16;k.z=CHEF_HOME[1];k.heading=0;k.phase=phase;k.walking=false;k.carrying=phase==='lifting'||phase==='turning'||phase==='carrying'||phase==='settingDown'||phase==='withdrawing';
  const s=chefSchedule(order.cookedAt??0),routes=chefRoutes();
  if(phase==='turning')k.heading=Math.PI/2*ease((now-s.liftedAt)/CHEF_TURN_MS);
  else if(phase==='carrying'){sampleRoute(routes.toPass,(now-s.departAt)/routes.duration,k);k.walking=true;}
  else if(phase==='settingDown'||phase==='withdrawing'){k.x=CHEF_PASS[0];k.z=CHEF_PASS[1];k.heading=Math.PI/2*(1-ease((now-s.arriveAt)/CHEF_TURN_MS));}
  else if(phase==='returning'){
    if(now<s.returnAt){k.x=CHEF_PASS[0];k.z=CHEF_PASS[1];k.heading=-Math.PI/2*ease((now-s.withdrawnAt)/CHEF_TURN_MS);}
    else if(now<s.stoveAt){sampleRoute(routes.toStove,(now-s.returnAt)/routes.duration,k);k.walking=true;}
    else k.heading=-Math.PI/2*(1-ease((now-s.stoveAt)/CHEF_TURN_MS));
  }
  const carryY=KITCHEN_COUNTER_TOP+PLATE_LIFT+.26,pickupY=KITCHEN_COUNTER_TOP+PLATE_LIFT,reach=ease((now-s.arriveAt-CHEF_TURN_MS)/(CHEF_SETDOWN_MS-CHEF_TURN_MS));
  p[0]=k.x+Math.sin(k.heading)*.5;p[1]=phase==='lifting'?mix(pickupY+.08,carryY,ease((now-(order.cookedAt??0))/CHEF_LIFT_MS)):carryY;p[2]=k.z+Math.cos(k.heading)*.5;out.heading=k.heading;
  if(phase==='settingDown'){p[0]=mix(p[0],PICKUP_PLATE[0],reach);p[1]=mix(carryY,pickupY,reach);p[2]=mix(p[2],PICKUP_PLATE[2],reach);}
  if(now>=s.counterReadyAt){p[0]=PICKUP_PLATE[0];p[1]=pickupY;p[2]=PICKUP_PLATE[2];out.heading=0;}
  out.visible=order.status!=='finished'&&order.cookedAt!==undefined&&now>=order.cookedAt;
  h.release=phase==='withdrawing'?ease((now-s.counterReadyAt)/CHEF_WITHDRAW_MS):0;h.bend=.35*reach*(1-h.release);h.hips=.84-h.bend*.27;
  const dx=p[0]-k.x,dz=p[2]-k.z,sin=Math.sin(k.heading),cos=Math.cos(k.heading);
  h.handX=mix(dx*cos-dz*sin,0,h.release);h.handY=mix(p[1]-k.y-PLATE_LIFT-.018,.72,h.release);h.handZ=mix(dx*sin+dz*cos,.03,h.release);
  return out;
}
/** One plate follows counter -> hands -> tabletop, without replacing or rescaling its mesh. */
export function sampleMealPresentation(order:ServiceTimes&{seatId:string;status:string},now:number,npc:{x:number;y:number;z:number;heading:number},out:MealPresentation){
  if(order.counterReadyAt!==undefined&&now<order.counterReadyAt)return sampleKitchenMeal(order,now,out);
  const plan=mealPlan(order.seatId),phase=servicePhase(order,now),p=out.position,h=out.hands;
  const sin=Math.sin(npc.heading),cos=Math.cos(npc.heading),carryX=npc.x+sin*.6,carryY=npc.y+.9+PLATE_LIFT+.018,carryZ=npc.z+cos*.6;
  const elapsed=now-(order.readyAt-HANDOFF_MS),reach=ease((elapsed-TURN_MS)/(HANDOFF_MS-TURN_MS-WITHDRAW_MS)),release=ease((elapsed-(HANDOFF_MS-WITHDRAW_MS))/WITHDRAW_MS);
  out.visible=order.status!=='finished'&&(order.cookedAt===undefined?order.status==='ready'||order.status==='eating':now>=order.cookedAt);
  p[0]=carryX;p[1]=carryY;p[2]=carryZ;out.heading=npc.heading;
  h.bend=0;h.release=0;
  if(order.status==='ready'||order.status==='eating'||now>=order.readyAt-WITHDRAW_MS){p[0]=plan.plate[0];p[1]=plan.plate[1];p[2]=plan.plate[2];out.heading=plan.heading;}
  else if(phase==='toKitchen'||phase==='waiting'){
    p[0]=PICKUP_PLATE[0];p[1]=KITCHEN_COUNTER_TOP+PLATE_LIFT;p[2]=PICKUP_PLATE[2];out.heading=0;
  }else if(phase==='pickup'){
    const pickupStart=Math.max(counterAvailableAt(order),order.kitchenAt??0),t=ease((now-pickupStart)/PICKUP_MS);
    p[0]=mix(PICKUP_PLATE[0],carryX,t);p[1]=mix(KITCHEN_COUNTER_TOP+PLATE_LIFT,carryY,t)+Math.sin(Math.PI*t)*.08;p[2]=mix(PICKUP_PLATE[2],carryZ,t);
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
