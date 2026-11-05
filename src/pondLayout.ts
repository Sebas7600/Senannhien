import {lotusWaterBlocked} from './lotusLayout';
export const KOI_POND={x:33,z:9,rx:8.5,rz:11,waterY:.085,bridgeHalfLength:11,bridgeHalfWidth:1.5};
export function bridgeHeight(x:number){return .06+.38*Math.min(1,Math.max(0,(11-Math.abs(x-33))/2))}
export function pondBlocked(x:number,z:number,margin=.3){return (((x-33)/(8.5+margin))**2+((z-9)/(11+margin))**2<1&&Math.abs(z-9)>1.5-margin)||lotusWaterBlocked(x,z,margin)}
export const feedStations=[...Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return {id:'shore-'+i,spot:[33+Math.cos(a)*9.4,9+Math.sin(a)*11.9] as [number,number],target:[33+Math.cos(a)*7.1,9+Math.sin(a)*9.3] as [number,number]}}),...[-5,0,5].flatMap((x,i)=>[-1,1].map(side=>({id:'bridge-'+i+'-'+(side+1),spot:[33+x,9+side*.85] as [number,number],target:[33+x,9+side*3] as [number,number]})))];
export function nearestFeedStation(p:readonly number[]){return feedStations.reduce((a,b)=>Math.hypot(p[0]-a.spot[0],p[1]-a.spot[1])<Math.hypot(p[0]-b.spot[0],p[1]-b.spot[1])?a:b)}
