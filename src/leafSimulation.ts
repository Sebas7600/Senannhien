import {BODHI} from './bodhiData';
import {courtyardTrees,COURTYARD_TREE,restingBenches} from './courtyardData';
import {walkable} from './gameData';

export const LEAVES={perTree:60,cycleMs:150000,fallMs:9000,gatherMs:1150,renewMs:90000} as const;
export const leafSources=[
  {id:'bodhi',x:BODHI.x,z:BODHI.z,ground:BODHI.ground+.025,canopyY:7.2,radius:BODHI.radius,minRadius:3.9,maxRadius:7},
  ...courtyardTrees.map(t=>({id:t.id,x:t.x,z:t.z,ground:COURTYARD_TREE.ground+.025,canopyY:5.1,radius:COURTYARD_TREE.radius,minRadius:3.5,maxRadius:5.2})),
];
export interface LeafSlot {source:number;index:number;seed:number;landX:number;landZ:number;startX:number;startZ:number;startY:number;size:number;fallAt:number;collectedAt:number;gatherX:number;gatherZ:number;dirty:boolean;phase:'falling'|'ground'|'cleared'}
export interface LeafPose {x:number;y:number;z:number;rx:number;ry:number;rz:number;scale:number}
const fraction=(v:number)=>v-Math.floor(v);
const random=(seed:number)=>fraction(Math.sin(seed*127.1+311.7)*43758.5453);
function safeLanding(x:number,z:number){return walkable(x,z,.22)&&!restingBenches.some(b=>{const dx=x-b.x,dz=z-b.z,c=Math.cos(b.rotation),s=Math.sin(b.rotation);return Math.abs(c*dx-s*dz)<1.1&&Math.abs(s*dx+c*dz)<.55;});}
export function createLeafPool(now:number):LeafSlot[]{return leafSources.flatMap((source,si)=>Array.from({length:LEAVES.perTree},(_,i)=>{
  const seed=si*LEAVES.perTree+i+1;let x=0,z=0,found=false;
  for(let attempt=0;attempt<64;attempt++){const a=i*2.3999632297+si*.71+attempt*1.17,r=source.minRadius+random(seed+attempt*17)*(source.maxRadius-source.minRadius);x=source.x+Math.cos(a)*r;z=source.z+Math.sin(a)*r;if(safeLanding(x,z)){found=true;break;}}
  if(!found)throw Error('No safe leaf landing for '+source.id+' '+i);
  return {source:si,index:i,seed,landX:x,landZ:z,startX:source.x+(x-source.x)*.52,startZ:source.z+(z-source.z)*.52,startY:source.canopyY+random(seed+101)*.8,size:.185+random(seed+211)*.08,fallAt:now-(i+.4)*LEAVES.cycleMs/LEAVES.perTree,collectedAt:0,gatherX:0,gatherZ:0,dirty:true,phase:'falling' as const};
}));}
export function advanceLeaf(slot:LeafSlot,now:number){
  const next=Math.max(slot.fallAt+LEAVES.cycleMs,slot.collectedAt?slot.collectedAt+LEAVES.renewMs:0);
  if(now>=next){slot.fallAt=next+Math.floor((now-next)/LEAVES.cycleMs)*LEAVES.cycleMs;slot.collectedAt=0;slot.dirty=true;}
  const phase=slot.collectedAt?'cleared':now-slot.fallAt<LEAVES.fallMs?'falling':'ground';if(phase!==slot.phase){slot.phase=phase;slot.dirty=true;}
}
export interface BroomContact{
  fromX:number;fromZ:number;x:number;z:number;ground:number;radius:number;
  forwardX:number;forwardZ:number;depthScale:number;
}
export function collectLeaf(slot:LeafSlot,now:number,contact:BroomContact){
  if(slot.collectedAt||now-slot.fallAt<LEAVES.fallMs)return false;
  const source=leafSources[slot.source];
  if(Math.abs(source.ground-contact.ground)>.2)return false;
  const xFrom=slot.landX-contact.fromX,zFrom=slot.landZ-contact.fromZ;
  const travelX=contact.x-contact.fromX,travelZ=contact.z-contact.fromZ;
  const {forwardX,forwardZ,depthScale}=contact;
  // In broom space, compress the long axis of the fan before testing its swept path.
  const side=xFrom*forwardZ-zFrom*forwardX,depth=(xFrom*forwardX+zFrom*forwardZ)*depthScale;
  const sideTravel=travelX*forwardZ-travelZ*forwardX,depthTravel=(travelX*forwardX+travelZ*forwardZ)*depthScale;
  const length=sideTravel*sideTravel+depthTravel*depthTravel;
  const t=length>0?Math.max(0,Math.min(1,(side*sideTravel+depth*depthTravel)/length)):0;
  const dx=side-sideTravel*t,dz=depth-depthTravel*t,r=contact.radius+slot.size*.32;
  if(dx*dx+dz*dz>r*r)return false;
  // Gather just outside the raised stone rim so the leaf stays visible at the roots.
  const x=slot.landX-source.x,z=slot.landZ-source.z,ratio=(source.radius+.16)/(Math.hypot(x,z)||1);
  slot.gatherX=source.x+x*ratio;slot.gatherZ=source.z+z*ratio;
  slot.collectedAt=now;slot.dirty=true;return true;
}
const smooth=(t:number)=>t*t*(3-2*t);
/** Writes into one caller-owned object; no particles, arrays or vectors are allocated per sample. */
export function sampleLeaf(slot:LeafSlot,now:number,reduced:boolean,out:LeafPose){
  const source=leafSources[slot.source],age=now-slot.fallAt,rotation=slot.seed*2.3999632297;
  out.x=slot.landX;out.y=source.ground;out.z=slot.landZ;out.rx=-Math.PI/2;out.ry=0;out.rz=rotation;out.scale=slot.size;
  if(slot.collectedAt){
    const t=Math.max(0,(now-slot.collectedAt)/LEAVES.gatherMs);
    if(t>=1||reduced){out.scale=0;return out;}
    const travel=smooth(Math.min(1,t/.84));
    out.x+=(slot.gatherX-out.x)*travel;out.z+=(slot.gatherZ-out.z)*travel;
    out.y+=Math.sin(travel*Math.PI)*.07;out.rz+=travel*1.1;
    out.scale*=1-smooth(Math.max(0,(t-.84)/.16));
    return out;
  }
  if(age<0){out.scale=0;return out;}
  if(age<LEAVES.fallMs){if(reduced){out.scale=0;return out;}const t=age/LEAVES.fallMs,wave=Math.sin(t*Math.PI),settle=1-smooth(Math.max(0,(t-.75)/.25));out.x=slot.startX+(slot.landX-slot.startX)*t+Math.sin(t*9+rotation)*wave*.28;out.z=slot.startZ+(slot.landZ-slot.startZ)*t+Math.cos(t*7+rotation)*wave*.24;out.y=source.ground+(slot.startY-source.ground)*(1-t)+Math.sin(t*15+rotation)*wave*.06;out.rx=-Math.PI/2+Math.sin(t*11+rotation)*.75*settle;out.ry=Math.sin(t*8+rotation)*.55*settle;out.rz=rotation+t*2.4*settle;}
  return out;
}
