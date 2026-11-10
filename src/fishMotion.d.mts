export function koiTarget(index:number,seconds:number,food:{x:number;z:number}|null,out?:[number,number]):[number,number];
export function steerKoi(x:number,z:number,tx:number,tz:number,step:number,out?:[number,number]):[number,number];
export {FISH_FEED_LIFETIME,foodIsActive} from './pondScene.mjs';
