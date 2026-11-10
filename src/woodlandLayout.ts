import {pondContains,POND_BRIDGES} from './pondLayout';
import {GATE} from './courtyardPropsData';
import {bambooZoneBounds} from './courtyardZoneData';
import type {Vec3} from './gameData';
/** Grove edges frame the compound; no random trees inside the lake or bridge landings. */
const positions:Vec3[]=[];
for(let row=0;row<2;row++){
 const edge=65+row*10;
 for(let i=0;i<16;i++)for(const side of [-1,1])positions.push([side*(edge+Math.sin(i*2.4+row)*1.3),0,-61+i*8.4+row*2.8]);
 for(let i=0;i<15;i++){
  const x=-60+i*8.4+row*2.7;
  positions.push([x,0,-73-row*9+Math.sin(i*2.7)*1.2]);
  if(Math.abs(x)>14)positions.push([x,0,82+row*9+Math.cos(i*2.3)*1.4]);
 }
}
// Sparse west-side grove, with gaps between the bamboo garden and pagoda path.
for(let i=0;i<8;i++)positions.push([-55+(i%2)*4,0,35+Math.floor(i/2)*7]);
const [west,east,north,south]=bambooZoneBounds;
export const forestPositions=positions.filter(([x,,z])=>!pondContains(x,z,3.5)&&Math.hypot(x-GATE.x,z-GATE.z)>14&&
 !POND_BRIDGES.some(b=>Math.abs(z-b.z)<b.halfWidth+3&&x>b.start-3&&x<b.end+3)&&
 (x<west-2.7||x>east+2.7||z<north-2.7||z>south+2.7));
export const woodlandSolids=forestPositions.flatMap(([x,,z],i)=>Math.abs(x)<60&&z>-66&&z<76?[{id:'forest-trunk-'+i,x,z,w:.56*(.75+i%4*.18),d:.56*(.75+i%4*.18),height:3,round:true}]:[]);
