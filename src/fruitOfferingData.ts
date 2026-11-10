import {BODHI} from './bodhiData';
import {QUAN_AM} from './quanAmData';
import {HALL_INCENSE} from './ritualStations.mjs';
export const FRUIT_OFFERING_MS=8*60*1000;
export const fruitAltars=[
 {id:'temple',label:'Đại Hùng Bảo Điện',spot:[.76,-28] as [number,number],range:2.2,plate:[.76,3.075,-28.425] as [number,number,number]},
 {id:'bodhi',label:'Bàn thờ bồ đề',spot:BODHI.offeringPoint,range:3.3,plate:[BODHI.x+.56,BODHI.ground+BODHI.altarHeight+.06,BODHI.incensePosition[2]] as [number,number,number]},
 {id:'quan-am',label:'Bàn thờ Quan Âm',spot:QUAN_AM.spot,range:QUAN_AM.range,plate:[QUAN_AM.tableX,QUAN_AM.ground+1.18,QUAN_AM.tableZ+.63] as [number,number,number]},
 {id:'truc-lam',label:'Thiền đường Trúc Lâm',spot:HALL_INCENSE.spot,range:HALL_INCENSE.range,plate:[-32.3,1.25,-21.9] as [number,number,number]},
];
export function nearFruitAltar(p:readonly number[]){return fruitAltars.find(altar=>Math.hypot(p[0]-altar.spot[0],p[1]-altar.spot[1])<=altar.range);}
export function nearestFruitAltar(p:readonly number[]){return fruitAltars.reduce((a,b)=>Math.hypot(p[0]-a.spot[0],p[1]-a.spot[1])<Math.hypot(p[0]-b.spot[0],p[1]-b.spot[1])?a:b);}
export type FruitOffering={altar:string;at:number};
export function cleanFruitOfferings(value:unknown,now=Date.now()):FruitOffering[]{
 if(!Array.isArray(value))return [];
 const result=new Map<string,FruitOffering>();for(const item of value){if(item&&fruitAltars.some(altar=>altar.id===item.altar)&&Number.isFinite(item.at)&&item.at<=now&&now-item.at<FRUIT_OFFERING_MS)result.set(item.altar,{altar:item.altar,at:item.at});}
 return [...result.values()];
}
