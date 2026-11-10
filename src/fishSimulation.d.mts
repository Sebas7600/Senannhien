export const FISH_COUNT:number;
export interface FishSchool {at:number;epoch:number;poses:number[];states:{x:number;z:number;at:number;blend:number;speed:number;feedAt:number|null;eating:boolean}[]}
export interface FishSnapshot {at:number;seconds:number;poses:number[]}
export function createFishSchool(at:number):FishSchool;
export function advanceFishSchool(school:FishSchool,now:number,foods:{at:number;x:number;z:number;eatingAt?:number}[]):FishSchool;
export function fishSnapshot(school:FishSchool):FishSnapshot;
