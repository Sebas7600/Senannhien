import {templeVaseSolids,middleStairRails} from './templeDetailCollision';
import {isPorticoColumn,porticoColumnTop,removedTemplePost} from './templeLayout';
import objectShapes from './templeObjectColliders.json';
import {templeFixtures} from './templeFixtures';
export type TempleCollider={kind:'box'|'cylinder';position:[number,number,number];args:[number,number,number]|[number,number];rotationX?:number;cameraWall?:boolean};
const allTempleColliders:TempleCollider[]=[
 // Raised ceiling and upper infill also stop the camera sphere leaving the hall.
 {kind:'box',cameraWall:true,position:[0,9.85,0],args:[14.5,.10,10.25]},
 ...[-1,1].map(side=>({kind:'box' as const,cameraWall:true,position:[side*12.6,8.05,0] as [number,number,number],args:[.17,1.9,7.85] as [number,number,number]})),
 {kind:'box',cameraWall:true,position:[0,8.05,-7.625],args:[12.775,1.9,.17]},
 ...[7.45,8.9].map(z=>({kind:'box' as const,cameraWall:true,position:[0,7.7,z] as [number,number,number],args:[13.25,2.25,.15] as [number,number,number]})),
 ...templeVaseSolids.map(v=>({kind:'cylinder' as const,position:[v.x,v.y,v.z] as [number,number,number],args:[v.height/2,v.radius] as [number,number]})),
 ...middleStairRails.map(r=>({kind:'box' as const,position:[r.x,r.y,r.z] as [number,number,number],args:[r.halfWidth,r.halfHeight,r.halfDepth] as [number,number,number]})),
 ...objectShapes.map((s):TempleCollider=>{
  const [x,y,z]=s.position;
  if(s.kind==='cylinder'&&isPorticoColumn(x,z)){
   const base=y-s.args[0];
   return {kind:'cylinder',position:[x,(base+porticoColumnTop)/2,z],args:[(porticoColumnTop-base)/2,s.args[1]]};
  }
  return {...s,kind:s.kind as 'box'|'cylinder',position:s.position as [number,number,number],args:s.args as [number,number,number]};
 }),
 {kind:'box',position:[0,1.05,0],args:[14.25,1.15,9.775]},
 // Solid treads follow the reference footprint and extend to the ground: no open underside.
 ...Array.from({length:templeFixtures.stairs.count},(_,i)=>{const s=templeFixtures.stairs,depth=(s.front-s.back)/s.count,height=(i+1)*s.rise/s.count;return {kind:'box' as const,position:[0,height/2,s.front-(i+.5)*depth] as [number,number,number],args:[s.halfWidth,height/2,depth/2+.001] as [number,number,number]}}),
 ...[-1,1].map(side=>({kind:'box' as const,position:[side*7.325,1.46,12.965] as [number,number,number],rotationX:Math.atan2(2.175,6.806),args:[.12,.34,3.59] as [number,number,number]})),
 ...[-1,1].flatMap(side=>[
 {kind:'box' as const,cameraWall:true,position:[side*12.6,4.23,0] as [number,number,number],args:[.158,2.045,7.7] as [number,number,number]},
 {kind:'box' as const,cameraWall:true,position:[side*7.45,4.23,7.45] as [number,number,number],args:[5.15,2.045,.18] as [number,number,number]},
 {kind:'box' as const,position:[side*14,2.52,0] as [number,number,number],args:[.12,.34,9.65] as [number,number,number]},
 {kind:'box' as const,position:[side*10.8,2.52,9.65] as [number,number,number],args:[3.12,.34,.12] as [number,number,number]}
 ]),
 {kind:'box',cameraWall:true,position:[0,4.23,-7.625],args:[12.625,2.045,.15]},
 {kind:'box',position:[0,4.2,-4.3],args:[7.1,2,3]},
 ...[-11.5,-7.025,-2.35,2.35,7.025,11.5].flatMap(x=>[-6.75,-3.4,1,4.9].map(z=>({kind:'cylinder' as const,position:[x,5.2,z] as [number,number,number],args:[3,.3] as [number,number]}))),
];

export const templeColliders=allTempleColliders.filter(s=>!(removedTemplePost(s.position[0],s.position[2])&&(s.kind==='cylinder'||(s.args[0]<1.5&&(s.args[2]||0)<1.5))));
