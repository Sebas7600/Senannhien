import {POND,ISLAND,POND_BRIDGES,pondContains} from './pondLayout';
type Point=readonly[number,number];
/** Equal quotas in four water sectors; spacing also keeps flowers out of bridges. */
export function lotusWaterClear(x:number,z:number,margin=.8){return pondContains(x,z,-margin)&&Math.hypot(x-ISLAND.x,z-ISLAND.z)>ISLAND.radius+margin&&!POND_BRIDGES.some(b=>x>b.start-margin&&x<b.end+margin&&Math.abs(z-b.z)<b.halfWidth+margin)}
const sectors:Point[][]=[];
for(const sx of [-1,1])for(const sz of [-1,1]){
 const candidates:Point[]=[];
 for(let ix=0;ix<12;ix++)for(let iz=0;iz<20;iz++){
  const x=POND.x+sx*(1+ix*.86),z=POND.z+sz*(1+iz*.98);
  if(lotusWaterClear(x,z,1.05))candidates.push([x,z]);
 }
 const chosen:Point[]=[];
 while(chosen.length<14&&candidates.length){
  let best=0,score=-1;
  candidates.forEach(([x,z],i)=>{const d=chosen.length?Math.min(...chosen.map(([a,b])=>Math.hypot(x-a,z-b))):Math.hypot(x-POND.x,z-POND.z);if(d>score){best=i;score=d}});
  chosen.push(candidates.splice(best,1)[0]);
 }
 sectors.push(chosen);
}
export const driftingLotusAnchors=sectors.flatMap(sector=>sector.slice(0,3));
export const lotusPositions=sectors.flatMap(sector=>sector.slice(3));
