import {ISLAND,POND,pondContains} from './pondLayout';

export const FISH_FEED_LIFETIME=12000;
const FULL_TURN=2*Math.PI;
const ISLAND_CLEARANCE=ISLAND.radius+.55;
type KoiPoint=[number,number];

type FoodPoint={x:number;z:number};

export function koiFeedTarget(index:number,seconds:number,food:FoodPoint,out:KoiPoint=[0,0]){
  const phase=seconds*.20+index*2.399;
  out[0]=food.x+Math.cos(phase)*(.45+index%4*.23);
  out[1]=food.z+Math.sin(phase)*(.48+index%3*.26);
  return out;
}

export function createKoiSwimmer(index:number){
  const angle=index*2.399963,spread=.58+index%4*.085;
  const x=POND.x+Math.cos(angle)*POND.rx*spread,z=POND.z+Math.sin(angle)*POND.rz*spread;
  const seed=Math.imul(index+1,0x9e3779b9)>>>0;
  return {index,x,z,yaw:angle,homeX:x,homeZ:z,waypoint:[x,z] as KoiPoint,target:[x,z] as KoiPoint,seed};
}
type KoiSwimmer=ReturnType<typeof createKoiSwimmer>;

function nextRandom(fish:KoiSwimmer){
  fish.seed=(Math.imul(fish.seed,1664525)+1013904223)>>>0;
  return fish.seed/0x100000000;
}

function chooseWaypoint(fish:KoiSwimmer){
  for(let attempt=0;attempt<8;attempt++){
    const angle=nextRandom(fish)*FULL_TURN;
    const distance=2.5+nextRandom(fish)*8;
    const x=fish.x+Math.cos(angle)*distance,z=fish.z+Math.sin(angle)*distance;
    const dx=x-ISLAND.x,dz=z-ISLAND.z;
    if(pondContains(x,z,-1)&&dx*dx+dz*dz>(ISLAND_CLEARANCE+.35)**2){
      fish.waypoint[0]=x;fish.waypoint[1]=z;
      return;
    }
  }
  // If nearby samples all hit land, pick another point in open water.
  const angle=nextRandom(fish)*FULL_TURN;
  fish.waypoint[0]=POND.x+Math.cos(angle)*POND.rx*.65;
  fish.waypoint[1]=POND.z+Math.sin(angle)*POND.rz*.65;
}

export function advanceKoi(fish:KoiSwimmer,seconds:number,dt:number,food:FoodPoint|null,reduced:boolean,feedBlend:number,turnBlend:number){
  const {target,x,z,index}=fish;
  if(food){
    koiFeedTarget(index,seconds,food,target);
  }else if(reduced){
    target[0]=fish.homeX;target[1]=fish.homeZ;
  }else{
    const dx=fish.waypoint[0]-x,dz=fish.waypoint[1]-z;
    if(dx*dx+dz*dz<.16)chooseWaypoint(fish);
    target[0]=fish.waypoint[0];target[1]=fish.waypoint[1];
  }

  steerKoiAroundIsland(x,z,target);
  const dx=target[0]-x,dz=target[1]-z;
  const distanceSquared=dx*dx+dz*dz;
  if(distanceSquared<1e-8)return;

  const swimSpeed=1.35+(index%5)*.15;
  const blend=food?feedBlend:Math.min(1,swimSpeed*dt/Math.sqrt(distanceSquared));
  fish.x+=dx*blend;fish.z+=dz*blend;
  const desiredYaw=Math.atan2(dx,dz);
  const turn=desiredYaw-fish.yaw;
  const shortestTurn=((turn+Math.PI)%FULL_TURN+FULL_TURN)%FULL_TURN-Math.PI;
  fish.yaw+=shortestTurn*turnBlend;
}

/** A short steering waypoint sends a fish around the island if its direct path crosses it. */
export function steerKoiAroundIsland(x:number,z:number,target:KoiPoint){
  const fromX=x-ISLAND.x,fromZ=z-ISLAND.z;
  const toX=target[0]-ISLAND.x,toZ=target[1]-ISLAND.z;
  const dx=toX-fromX,dz=toZ-fromZ,lengthSquared=dx*dx+dz*dz;
  if(lengthSquared===0)return;
  const closest=Math.max(0,Math.min(1,-(fromX*dx+fromZ*dz)/lengthSquared));
  const nearX=fromX+closest*dx,nearZ=fromZ+closest*dz;
  if(nearX*nearX+nearZ*nearZ>=ISLAND_CLEARANCE*ISLAND_CLEARANCE)return;

  const startAngle=Math.atan2(fromZ,fromX),endAngle=Math.atan2(toZ,toX);
  const turn=Math.atan2(Math.sin(endAngle-startAngle),Math.cos(endAngle-startAngle));
  const angle=startAngle+Math.max(-.48,Math.min(.48,turn));
  const radius=ISLAND_CLEARANCE+1;
  target[0]=ISLAND.x+Math.cos(angle)*radius;
  target[1]=ISLAND.z+Math.sin(angle)*radius;
}
