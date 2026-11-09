export const POND={x:29.5,z:23,rx:13.2,rz:25,waterY:-.29,bankY:.055,bottomY:-.60,segments:112};
export const ISLAND={x:POND.x,z:POND.z,radius:5.1,top:.44};
export const POND_BRIDGES=[
  {start:15.8,end:44.4,z:9,halfWidth:1.5,rampStart:2.1,rampEnd:2.1},
  {start:13.4,end:25.8,z:ISLAND.z,halfWidth:1.72,rampStart:2.1,rampEnd:0},
];
export const QUAN_AM_SPOT=[ISLAND.x-4.15,ISLAND.z];

export function bridgeHeight(x,bridge=POND_BRIDGES[0]){
  const near=(x-bridge.start)/bridge.rampStart;
  const far=bridge.rampEnd?(bridge.end-x)/bridge.rampEnd:1;
  return .06+.38*Math.max(0,Math.min(1,near,far));
}

export function pondContains(x,z,margin=0){
  return ((x-POND.x)/(POND.rx+margin))**2+((z-POND.z)/(POND.rz+margin))**2<1;
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
  return {id:'shore-'+i,spot:[POND.x+cos*(POND.rx+1.1),POND.z+sin*(POND.rz+1.1)],
    target:[POND.x+cos*(POND.rx-1.8),POND.z+sin*(POND.rz-1.8)]};
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
