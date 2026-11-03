import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Dimensions in metres. The profile is drawn in the depth/height plane and
// extruded as one continuous slab across both sitting positions.
export const STONE_BENCH={width:1.8,seatHeight:.45,depth:.63,backHeight:.89,seatOffset:.43,seatZ:.035} as const;
function profile(width:number,draw:(s:THREE.Shape)=>void,detail:number){const s=new THREE.Shape();draw(s);const g=new THREE.ExtrudeGeometry(s,{depth:width,steps:1,curveSegments:detail?5:3,bevelEnabled:true,bevelSegments:detail?2:1,bevelSize:.009,bevelThickness:.009});g.rotateY(Math.PI/2);g.translate(-width/2,0,0);g.computeVertexNormals();return g;}
// Shape x = -world z, so the front of the bench faces local +Z.
function createParts(detail:number){const seat=profile(STONE_BENCH.width,s=>{
  s.moveTo(.24,.473);s.quadraticCurveTo(0,.433,-.23,.473);
  s.quadraticCurveTo(-.265,.472,-.267,.445);s.lineTo(-.26,.415);
  s.quadraticCurveTo(0,.390,.24,.425);s.closePath();
},detail);
const back=profile(STONE_BENCH.width,s=>{
  s.moveTo(.225,.555);s.quadraticCurveTo(.24,.69,.29,.84);
  s.quadraticCurveTo(.305,.885,.335,.885);s.quadraticCurveTo(.37,.885,.369,.851);
  s.lineTo(.295,.548);s.closePath();
},detail);
// Two cast side trestles, with an arched opening and a backrest support.
const leg=profile(.105,s=>{
  s.moveTo(-.24,.015);s.quadraticCurveTo(-.275,.015,-.26,.065);
  s.lineTo(-.145,.418);s.quadraticCurveTo(-.13,.45,-.04,.45);
  s.lineTo(.19,.45);s.lineTo(.285,.69);s.quadraticCurveTo(.30,.725,.338,.715);
  s.lineTo(.365,.705);s.lineTo(.25,.065);s.quadraticCurveTo(.24,.015,.20,.015);
  s.lineTo(.135,.015);s.lineTo(.17,.28);s.quadraticCurveTo(.18,.34,.10,.34);
  s.lineTo(-.045,.34);s.quadraticCurveTo(-.075,.34,-.095,.29);
  s.lineTo(-.165,.015);s.closePath();
},detail);

return {seat,back,leg};}
export const benchNearParts=createParts(1),benchFarParts=createParts(0);
export const benchSeatGeometry=benchNearParts.seat,benchBackGeometry=benchNearParts.back,benchLegGeometry=benchNearParts.leg;

export function benchLocalSeat(side:number):[number,number,number]{return [side===0?-STONE_BENCH.seatOffset:STONE_BENCH.seatOffset,STONE_BENCH.seatHeight,STONE_BENCH.seatZ];}

export type BenchLOD='near'|'far';
// Follow the curved backrest instead of overlapping it with a flat decal.
const benchLetteringGeometry=(()=>{const p:number[]=[],uv:number[]=[],idx:number[]=[];for(let row=0;row<=6;row++){const y=.612+row/6*.23;let lo=0,hi=1;for(let i=0;i<20;i++){const t=(lo+hi)/2,yy=.555*(1-t)*(1-t)+.69*2*(1-t)*t+.84*t*t;if(yy<y)lo=t;else hi=t;}const t=(lo+hi)/2,z=-(.225*(1-t)*(1-t)+.24*2*(1-t)*t+.29*t*t)+.018;for(const x of [-.535,.535]){p.push(x,y,z);uv.push(x<0?0:1,row/6)}}for(let row=0;row<6;row++){const a=row*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;})();

function mergeBench(parts:ReturnType<typeof createParts>){const items:THREE.BufferGeometry[]=[];
const add=(geometry:THREE.BufferGeometry,part:number,position?:[number,number,number],rotation?:[number,number,number])=>{let g=geometry.clone();if(g.index)g=g.toNonIndexed();if(rotation){g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);}if(position)g.translate(...position);g.setAttribute('benchPart',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(part),1));items.push(g);};
add(parts.seat,0);add(parts.back,0);for(const x of [-.61,.61])add(parts.leg,1,[x,0,0]);
add(benchLetteringGeometry,3);
for(const x of [-.61,.61])add(new THREE.CylinderGeometry(.009,.009,.006,6),2,[x,.595,-.227],[Math.PI/2+.2,0,0]);
const combined=mergeGeometries(items,false)!;const result=mergeVertices(combined,.00001);combined.dispose();items.forEach(g=>g.dispose());result.computeBoundingBox();result.computeBoundingSphere();return result;}
export const benchNearGeometry=mergeBench(benchNearParts),benchFarGeometry=mergeBench(benchFarParts);
export const benchGeometry=(lod:BenchLOD)=>lod==='near'?benchNearGeometry:benchFarGeometry;
