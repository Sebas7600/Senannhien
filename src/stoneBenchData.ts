import {restingBenches} from './courtyardData';
export const stoneBenches=[
  {id:0,x:19.8,z:2.1,rotation:Math.PI/2,zone:'pond',finish:'jade',name:'Ghế đá xanh ngọc 1'},
  {id:1,x:15.5,z:15,rotation:Math.PI/2,zone:'pond',finish:'ivory',name:'Ghế đá trắng ngà 2'},
  {id:2,x:49.3,z:18,rotation:-Math.PI/2,zone:'pond',finish:'brick',name:'Ghế đá đỏ gạch 3'},
  ...restingBenches,
] as const;
export const BENCH_SEAT_HEIGHT=.45;
export const BENCH_GROUND=.06;
export function benchSeatWorld(bench:typeof stoneBenches[number],side:number):[number,number,number]{const localX=side===0?-.43:.43,localZ=.035;return [bench.x+Math.cos(bench.rotation)*localX+Math.sin(bench.rotation)*localZ,BENCH_GROUND+BENCH_SEAT_HEIGHT,bench.z-Math.sin(bench.rotation)*localX+Math.cos(bench.rotation)*localZ];}
