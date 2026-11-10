import type {GameState,MealOrder,PlotState} from './gameStore';

export interface SharedOffering {kind:'incense'|'flower'|'candle'|'feed';at:number;station:string|null;x?:number;z?:number;eatingAt?:number}
export const mealTimeFields=['readyAt','orderedAt','cookedAt','counterReadyAt','kitchenAt','deliveryAt','homeAt','eatUntil'] as const;
export function mealTimingDeltas(meal:MealOrder|null,now:number){
  return meal?Object.fromEntries(mealTimeFields.filter(key=>Number.isFinite(meal[key])&&meal[key]!>0).map(key=>[key,meal[key]!-now])):null;
}
export function localPeerMeal(meal:MealOrder|null|undefined,serverTime:number,now:number):MealOrder|null{
  if(!meal)return null;
  const times=Object.fromEntries(mealTimeFields.filter(key=>Number.isFinite(meal[key])&&meal[key]!>0).map(key=>[key,meal[key]!+now-serverTime]));
  return {...meal,...times};
}

/** Canonical event times are translated once, so adding events or clock drift cannot restart old visuals. */
export function createRoomSnapshotApplier(){
  let lastOfferings:string|null=null,lastPlots:string|null=null;
  const offeringTimes=new Map<number,number>(),plotTimes=new Map<number,number>();
  return (offerings:SharedOffering[],plots:Record<string,PlotState>,serverTime:number,now:number,authoritative=false):Partial<GameState>=>{
    const patch:Partial<GameState>={},offset=now-serverTime;
    const local=(times:Map<number,number>,at:number)=>{let value=times.get(at);if(value===undefined){value=at+offset;times.set(at,value);}return value;};
    const signature=JSON.stringify(offerings);
    if(authoritative||signature!==lastOfferings){
      const used=new Set<number>();
      const at=(value:number)=>{used.add(value);return local(offeringTimes,value);};
      patch.fishFeeds=offerings.filter(o=>o.kind==='feed').map(o=>{
        const started=at(o.at),eating=o.eatingAt===undefined?undefined:at(o.eatingAt);
        return {at:started,x:o.x??22,z:o.z??6,expiresAt:(eating??started)+(eating===undefined?120000:18000),...(eating===undefined?{}:{eatingAt:eating})};
      });
      patch.fishFeedAt=Math.max(0,...patch.fishFeeds.map(o=>o.at));
      patch.offerings={flower:offerings.filter(o=>o.kind==='flower').map(o=>at(o.at)),candle:offerings.filter(o=>o.kind==='candle').map(o=>at(o.at))};
      patch.burningIncense=offerings.filter(o=>o.kind==='incense').map(o=>at(o.at));
      patch.offeringSlots=Object.fromEntries(offerings.filter(o=>o.station).map(o=>[at(o.at),o.station!]));
      patch.offeringServerTimes=Object.fromEntries(offerings.map(o=>[at(o.at),o.at]));
      for(const key of offeringTimes.keys())if(!used.has(key))offeringTimes.delete(key);
      lastOfferings=signature;
    }
    const plotSignature=JSON.stringify(plots);
    if(authoritative||plotSignature!==lastPlots){
      const used=new Set<number>();
      const at=(value:number)=>{used.add(value);return local(plotTimes,value);};
      patch.plots=Object.fromEntries(Object.entries(plots).map(([id,p])=>[id,{...p,plantedAt:at(p.plantedAt),wateredAt:p.wateredAt===null?null:at(p.wateredAt)}]));
      for(const key of plotTimes.keys())if(!used.has(key))plotTimes.delete(key);
      lastPlots=plotSignature;
    }
    return patch;
  };
}
