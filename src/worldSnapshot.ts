import {gateState} from './gateState';
import {cleanFruitOfferings} from './fruitOfferingData';
import {LANTERN_LIFETIME} from './ritualMotion';
import type {GameState} from './gameStore';

export interface WorldSnapshot {
 bell:{at:number;readyAt:number}|null;
 drum:{at:number}|null;
 gateOpen:boolean;
 waterJars:{units:number;at:number}[];
 lanterns:{at:number;text:string}[];
 leaves:{epoch:number;revision:number;cleared:number[][]};
 fireworks?:{at:number;seed:number;companyPresentationEnabled:boolean;owner?:string}|null;
 fruitOfferings?:{altar:string;at:number;owner?:string}[];
}

const FIREWORKS_DURATION_MS=300000;

/** Keep event starts stable while applying every authoritative room snapshot. */
export function createWorldSnapshotApplier(){
 let bell:{serverAt:number;at:number;readyAt:number}|null=null;
 let drum:{serverAt:number;at:number}|null=null;
 let fireworks:{key:string;show:NonNullable<GameState['fireworksShow']>}|null=null;
 let lanternTimes=new Map<number,number>(),fruitTimes=new Map<string,number>();
 return (world:WorldSnapshot,serverTime:number,now=Date.now()):Partial<GameState>=>{
  const offset=now-serverTime;
  const patch:Partial<GameState>={
   sharedWorld:{serverOffset:offset,leaves:world.leaves},
   waterJars:world.waterJars.map(j=>({...j,at:j.at+offset})),
  };
  gateState.setState({open:world.gateOpen});

  if(world.bell){
   if(bell?.serverAt!==world.bell.at)bell={serverAt:world.bell.at,at:world.bell.at+offset,readyAt:world.bell.readyAt+offset};
  }else bell=null;
  patch.worldBellAt=bell?.at??0;
  patch.worldBellReadyAt=bell?.readyAt??0;
  if(world.drum){
   if(drum?.serverAt!==world.drum.at)drum={serverAt:world.drum.at,at:world.drum.at+offset};
  }else drum=null;
  patch.worldDrumAt=drum?.at??0;

  // Reapply the server list after reconnect even when no new lantern was released.
  // Server timestamps stay as seeds; cached local starts avoid restarting flights.
  const nextLanternTimes=new Map<number,number>();
  patch.flights=world.lanterns.filter(l=>serverTime-l.at<LANTERN_LIFETIME).map(l=>{
   const at=lanternTimes.get(l.at)??l.at+offset;
   nextLanternTimes.set(l.at,at);
   return {text:l.text,at,serverAt:l.at};
  });
  lanternTimes=nextLanternTimes;

  const show=world.fireworks;
  if(show&&serverTime-show.at<FIREWORKS_DURATION_MS){
   const key=JSON.stringify([show.at,show.seed,show.companyPresentationEnabled]);
   if(fireworks?.key!==key)fireworks={key,show:{serverAt:show.at,startAt:show.at+offset,seed:show.seed,companyPresentationEnabled:show.companyPresentationEnabled}};
  }else fireworks=null;
  patch.fireworksShow=fireworks?.show??null;

  const nextFruitTimes=new Map<string,number>();
  patch.fruitOfferings=cleanFruitOfferings(world.fruitOfferings,serverTime).map(fruit=>{
   const key=JSON.stringify([fruit.altar,fruit.at]),at=fruitTimes.get(key)??fruit.at+offset;
   nextFruitTimes.set(key,at);
   return {altar:fruit.altar,at};
  });
  fruitTimes=nextFruitTimes;
  return patch;
 };
}
