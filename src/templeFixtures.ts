/** Measured from the reference GLB, in temple-local metres (root z = -27). */
export const templeFixtures={
 statueDais:{z:-4.725,top:3.06,mount:3.065},
 flowerMouth:[-3.7,3.25,-2.835] as [number,number,number],
 lampTable:{x:4.7,y:2.843,z:-2.7,halfWidth:1.3375,halfDepth:.4875},
 foundation:{halfWidth:14.25,halfDepth:9.775,top:2.2},
 stairs:{halfWidth:7.225,front:16.303,back:9.497,rise:2.175,count:24},
};
export function lampPlacement(index:number,tableX=templeFixtures.lampTable.x):[number,number,number]{
 const t=templeFixtures.lampTable;
 return [tableX+(index%4-1.5)*.32,t.y,t.z+(index<4?.31:.02)];
}
export type OfferingKind='flower'|'candle';
export interface OfferingStation{id:string;kind:OfferingKind;label:string;position:[number,number,number];spot:[number,number];approach:[number,number]}
const vase=(id:string,x:number,y:number,z:number,label:string):OfferingStation=>({id,kind:'flower',label,position:[x,y,z],spot:[x,z< -2?-29.5:z-27],approach:[x,z< -2?-28:z-26]});
export const offeringStations:Record<OfferingKind,OfferingStation[]>={
 flower:[
  ...[-5.7,-3.7,-1,1,3.7,5.7].map((x,i)=>vase('flower-table-'+i,x,3.25,-2.835,`Bình hoa trên bàn ${i+1}`)),
  ...[-6.575,-2.825,-1.875,1.875,2.825,6.575].map((x,i)=>vase('flower-floor-'+i,x,3.16,-3.1,`Bình lớn ${i+1}`)),
  ...[-.76,.76].map((x,i)=>vase('flower-low-'+i,x,3.07,-1.425,`Bình bàn lễ ${i+1}`)),
 ],
 candle:[-4.7,0,4.7].map((x,i)=>({id:'candle-table-'+i,kind:'candle',label:['Bàn thờ bên trái','Bàn thờ ở giữa','Bàn thờ bên phải'][i],position:[x,2.843,-2.7],spot:[x,-29.5],approach:[x,-28]})),
};
export const defaultOfferingStation={flower:offeringStations.flower[1],candle:offeringStations.candle[2]};
/** Retired decorative vases have no hit target; migrate their existing flowers into the altar. */
export function offeringStation(kind:OfferingKind,id?:string|null){return offeringStations[kind].find(s=>s.id===id)||defaultOfferingStation[kind]}
export function nearestOfferingStation(kind:OfferingKind,position:readonly number[],focus?:string|null){
 const preferred=offeringStations[kind].find(s=>s.id===focus);
 if(preferred&&Math.hypot(position[0]-preferred.spot[0],position[1]-preferred.spot[1])<2.5)return preferred;
 return offeringStations[kind].reduce((a,b)=>Math.hypot(position[0]-a.spot[0],position[1]-a.spot[1])<=Math.hypot(position[0]-b.spot[0],position[1]-b.spot[1])?a:b);
}
export function offeringCount(times:number[],slots:Record<string,string>,station:OfferingStation,now:number,lifetime:number){return times.filter(t=>now-t<lifetime&&offeringStation(station.kind,slots[t]).id===station.id).length}
export const donationChest={position:[10.6,2.2,-4.6] as [number,number,number],spot:[10.6,-31.6] as [number,number],range:2};
export function nearDonationChest(position:readonly number[]){return Math.hypot(position[0]-donationChest.spot[0],position[1]-donationChest.spot[1])<=donationChest.range}
export function templeSurfaceHeight(x:number,z:number){
 const {foundation:f,stairs:s}=templeFixtures;
 if(Math.abs(x)<=f.halfWidth&&Math.abs(z)<=f.halfDepth)return f.top;
 if(Math.abs(x)<=s.halfWidth&&z>=s.back&&z<=s.front)return Math.ceil((s.front-z)/(s.front-s.back)*s.count)*s.rise/s.count;
 return 0;
}
