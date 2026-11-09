export const POND={x:35.627486010449775,z:27.738653599873938,rx:12.3,rz:21.5,waterY:-.29,bankY:.055,bottomY:-.60,segments:112};
export const ISLAND={x:POND.x,z:POND.z,radius:5.1,top:.44};
export const POND_BRIDGES=[
  {start:POND.x-POND.rx-1.2,end:POND.x+POND.rx+1.2,z:12.238653599873938,halfWidth:1.5,rampStart:2.1,rampEnd:2.1,archRise:1.8},
  {start:POND.x-POND.rx-1.5,end:ISLAND.x-3.7,z:ISLAND.z,halfWidth:1.72,rampStart:2.1,rampEnd:0},
];
export const BRIDGE_ROAD={x:Math.ceil(POND_BRIDGES[0].end),northZ:-7,southZ:Math.ceil(POND_BRIDGES[0].z)};
export const QUAN_AM_SPOT=[ISLAND.x-4.15,ISLAND.z];

// Stop the island bridge rails at the rim, leaving a full-width landing to turn on.
export function bridgeRailEnd(bridge){
  return bridge.rampEnd===0?Math.min(bridge.end,ISLAND.x-Math.sqrt(ISLAND.radius**2-bridge.halfWidth**2)-.18):bridge.end;
}

export function bridgeHeight(x,bridge=POND_BRIDGES[0]){
  if(bridge.archRise){
    const t=Math.max(0,Math.min(1,(x-bridge.start)/(bridge.end-bridge.start)));
    // One continuous shallow arch, without separate ramps or a pinched central hump.
    return .06+4*bridge.archRise*t*(1-t);
  }
  const near=(x-bridge.start)/bridge.rampStart;
  const far=bridge.rampEnd?(bridge.end-x)/bridge.rampEnd:1;
  return .06+.38*Math.max(0,Math.min(1,near,far));
}

/** Deck, rails and physics all follow the same sampled arch. */
export function bridgeSegments(bridge){
  const edges=[bridge.start,bridge.start+bridge.rampStart,bridge.end-bridge.rampEnd,bridge.end];
  if(bridge.archRise){const count=Math.ceil((bridge.end-bridge.start)/.45);for(let i=1;i<count;i++)edges.push(bridge.start+(bridge.end-bridge.start)*i/count);}
  const sorted=[...new Set(edges)].sort((a,b)=>a-b);
  return sorted.slice(1).map((end,i)=>{const start=sorted[i],dy=bridgeHeight(end,bridge)-bridgeHeight(start,bridge);return {...bridge,x:(start+end)/2,y:(bridgeHeight(start,bridge)+bridgeHeight(end,bridge))/2,angle:Math.atan2(dy,end-start),length:Math.hypot(end-start,dy)};});
}

// A compact, asymmetric chamfered rectangle. All shoreline consumers share this contour.
export const POND_OUTLINE=[[-1,-.78],[-.75,-1],[.72,-1],[1,-.80],[1,.62],[.66,1],[-.62,1],[-1,.72]];
export function pondBoundary(angle,margin=0){
  const dx=Math.cos(angle),dz=Math.sin(angle);let distance=Infinity;
  for(let i=0;i<POND_OUTLINE.length;i++){
    const a=POND_OUTLINE[i],b=POND_OUTLINE[(i+1)%POND_OUTLINE.length];
    const ax=a[0]*(POND.rx+margin),az=a[1]*(POND.rz+margin),ex=(b[0]-a[0])*(POND.rx+margin),ez=(b[1]-a[1])*(POND.rz+margin);
    const denominator=dx*ez-dz*ex;if(Math.abs(denominator)<1e-9)continue;
    const t=(ax*ez-az*ex)/denominator,u=(ax*dz-az*dx)/denominator;
    if(t>=0&&u>=0&&u<=1)distance=Math.min(distance,t);
  }
  return [POND.x+dx*distance,POND.z+dz*distance];
}
export function pondContains(x,z,margin=0){
  const px=(x-POND.x)/(POND.rx+margin),pz=(z-POND.z)/(POND.rz+margin);
  return POND_OUTLINE.every((a,i)=>{const b=POND_OUTLINE[(i+1)%POND_OUTLINE.length];return (b[0]-a[0])*(pz-a[1])-(b[1]-a[1])*(px-a[0])>0;});
}

function onBridge(x,z,bridge,margin=0){
  return x>=bridge.start-margin&&x<=bridge.end+margin&&Math.abs(z-bridge.z)<=bridge.halfWidth-margin;
}

export function islandContains(x,z,margin=0){
  return (x-ISLAND.x)**2+(z-ISLAND.z)**2<=(ISLAND.radius-margin)**2;
}

export function pondBlocked(x,z,margin=.3){
  return pondContains(x,z,margin)&&!islandContains(x,z,margin)&&!POND_BRIDGES.some(bridge=>onBridge(x,z,bridge,margin));
}

export function pondSurface(x,z){
  if(islandContains(x,z))return ISLAND.top;
  const bridge=POND_BRIDGES.find(bridge=>onBridge(x,z,bridge));
  return bridge?bridgeHeight(x,bridge):null;
}

const shoreStations=Array.from({length:12},(_,i)=>{
  const angle=i*Math.PI/6,cos=Math.cos(angle),sin=Math.sin(angle);
  return {id:'shore-'+i,spot:pondBoundary(angle,1.1),
    target:pondBoundary(angle,-1.8)};
});
const koiBridge=POND_BRIDGES[0];
export const feedStations=[...shoreStations,...[-5,0,5].flatMap((dx,i)=>[-1,1].map(side=>({
  id:'bridge-'+i+'-'+(side+1),spot:[POND.x+dx,koiBridge.z+side*.85],
  target:[POND.x+dx,koiBridge.z+side*3],
})))].filter(station=>canFeedFrom(station.spot,station));

export function nearestFeedStation(position){
  return feedStations.reduce((a,b)=>Math.hypot(position[0]-a.spot[0],position[1]-a.spot[1])<
    Math.hypot(position[0]-b.spot[0],position[1]-b.spot[1])?a:b);
}

export function canFeedFrom(position,station){
 if(Math.hypot(position[0]-station.spot[0],position[1]-station.spot[1])>1.8)return false;
 for(const bridge of POND_BRIDGES){
  const dx=station.target[0]-position[0],dz=station.target[1]-position[1];
  // A throw cannot cross a bridge deck, including a target under that deck.
  for(let t=0;t<=1;t+=.05){const x=position[0]+dx*t,z=position[1]+dz*t;if(x>bridge.start&&x<bridge.end&&Math.abs(z-bridge.z)<bridge.halfWidth+.1){
   if(station.id.startsWith('bridge-')&&Math.abs(position[1]-bridge.z)>=.55&&(position[1]-bridge.z)*(station.target[1]-bridge.z)>0)continue;
   return false;
  }}
 }
 return true;
}
