import layout from './sharedWorldLayout.json' with {type:'json'};
const LEAVES=layout.leaves,leafSources=layout.leafSources;
export function createSharedLeaves(epoch){return layout.slots.map(s=>({...s,fallAt:s.fallAt+epoch}));}
export function advanceLeaf(slot,now){
  const next=Math.max(slot.fallAt+LEAVES.cycleMs,slot.collectedAt?slot.collectedAt+LEAVES.renewMs:0);
  if(now>=next){slot.fallAt=next+Math.floor((now-next)/LEAVES.cycleMs)*LEAVES.cycleMs;slot.collectedAt=0;slot.dirty=true;}
  const phase=slot.collectedAt?'cleared':now-slot.fallAt<LEAVES.fallMs?'falling':'ground';if(phase!==slot.phase){slot.phase=phase;slot.dirty=true;}
}
export function collectLeaf(slot,now,contact){
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
