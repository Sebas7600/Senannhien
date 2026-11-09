import {ISLAND,QUAN_AM_SPOT} from './pondLayout';

const {x,z}=ISLAND;
export const QUAN_AM={
  x,z,ground:ISLAND.top,rotation:-Math.PI/2,height:4.8,pedestalHeight:.56,
  incenseId:'quan-am',tableX:x-2.7,tableZ:z,ashY:ISLAND.top+1.30,
  spot:QUAN_AM_SPOT,approach:[x-4.65,z] as [number,number],range:2.0,
};
export const PAVILION_POSTS=Array.from({length:6},(_,i)=>{
  const angle=(i+.5)*Math.PI/3;
  return {x:Math.sin(angle)*2.8,z:Math.cos(angle)*2.8};
});
export function nearQuanAm(p:readonly number[]){return Math.hypot(p[0]-QUAN_AM.spot[0],p[1]-QUAN_AM.spot[1])<=QUAN_AM.range;}
export const quanAmObstacles=[
  {x:QUAN_AM.x,z:QUAN_AM.z,w:2.8,d:3.4,height:.62},
  {x:QUAN_AM.x,z:QUAN_AM.z,w:1.7,d:1.7,height:5.42},
  {x:QUAN_AM.tableX,z:QUAN_AM.tableZ,w:.9,d:2.3,height:1.15},
  ...[-1,1].map(side=>({x:QUAN_AM.x-1.1,z:QUAN_AM.z+side*2.05,w:.75,d:.75,height:1.7})),
  ...PAVILION_POSTS.map(post=>({x:QUAN_AM.x-post.z,z:QUAN_AM.z+post.x,w:.32,d:.32,height:5.6})),
].map(obstacle=>({...obstacle,base:ISLAND.top}));
