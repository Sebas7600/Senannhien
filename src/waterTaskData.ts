import {JAR_WATER_LEVELS} from './waterAssetLayout';
export const WATER_TASK={drawMs:3000,pourMs:2200,reward:8,range:2.4,pourRange:1.22,jarCapacity:4,useMs:180000,walkSpeed:3.1} as const;
export const WATER_WELL={x:23.7,z:-47.2,ground:.06,radius:1.14,height:1.1,approach:[25.6,-46.8] as [number,number]};
export const WATER_JARS=[29.2,32.4,35.6,38.8].map((x,id)=>({id,x,z:-37.65,ground:.06,radius:.58,height:1.12,approach:[x,-38.75] as [number,number]}));
export interface WaterJarState {units:number;at:number}
export interface WaterQuest {phase:'drawing'|'carrying'|'pouring';startedAt:number;phaseAt:number;room:string;jar:number|null}
export const emptyWaterJars=():WaterJarState[]=>WATER_JARS.map(()=>({units:0,at:0}));
export function jarUnits(jar:WaterJarState|undefined,now=Date.now()){if(!jar||!Number.isFinite(jar.units)||!Number.isFinite(jar.at))return 0;return Math.max(0,Math.min(WATER_TASK.jarCapacity,Math.floor(jar.units))-Math.floor(Math.max(0,now-jar.at)/WATER_TASK.useMs));}
export function nearWaterWell(position:readonly number[]){return Math.hypot(position[0]-WATER_WELL.x,position[1]-WATER_WELL.z)<=WATER_TASK.range;}
export function nearWaterJar(position:readonly number[],id:number){const jar=WATER_JARS[id];return !!jar&&position[1]<=jar.z-.35&&Math.hypot(position[0]-jar.x,position[1]-jar.z)<=WATER_TASK.pourRange;}
export function jarWaterHeight(fill:number){return .18+Math.max(0,Math.min(1,fill))*.74;}
export function jarWaterRadius(fill:number){const scaled=Math.max(0,Math.min(1,fill))*4,index=Math.min(3,Math.floor(scaled)),a=JAR_WATER_LEVELS[index],b=JAR_WATER_LEVELS[index+1];return a.radius+(b.radius-a.radius)*(scaled-index);}
export function nearestWaterJar(position:readonly number[],states:WaterJarState[],now=Date.now(),availableOnly=false){return WATER_JARS.filter(j=>!availableOnly||jarUnits(states[j.id],now)<WATER_TASK.jarCapacity).sort((a,b)=>Math.hypot(position[0]-a.x,position[1]-a.z)-Math.hypot(position[0]-b.x,position[1]-b.z))[0];}
