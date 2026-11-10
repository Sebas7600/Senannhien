import {souvenirSolids} from './souvenirData';
import {avenueFlagPoles} from './avenueFlagsData';
import {eveningPosts} from './eveningDecorData';
import {woodlandSolids} from './woodlandLayout';
/** Lightweight solid proxies for decorations that previously had visuals only. */
export type CourtyardSolid={id:string;x:number;z:number;w:number;d:number;height:number;base?:number;rotation?:number;round?:boolean;bench?:boolean};
export const ornamentalTrees=[
 {x:12,z:-46.6},
 {x:-13,z:-46.6},
 {x:47,z:-16},
 {x:-20,z:34},
];
export const courtyardSolids:CourtyardSolid[]=[
 ...souvenirSolids,
 ...avenueFlagPoles.map((p,i)=>({id:`avenue-flag-pole-${i}`,...p,w:.14,d:.14,height:5.6,round:true})),
 ...eveningPosts.map((p,i)=>({id:`evening-post-${i}`,...p,w:.28,d:.28,height:3,round:true})),
 ...ornamentalTrees.map(({x,z},i)=>({id:`ornamental-tree-${i}`,x,z,w:.92,d:.92,height:3.19,round:true})),
 ...woodlandSolids,
 ...Array.from({length:24},(_,i)=>({id:`garden-rock-${i}`,x:(i%2===0?-1:1)*(53+Math.sin(i*1.7)*2),z:-56+Math.floor(i/2)*10,w:2*(.55+(i%3)*.18),d:1.3,height:.55+(i%4)*.13,round:true})),
 ...Array.from({length:12},(_,i)=>({id:`vegetable-bed-${i}`,x:31+(i%4)*3.1,z:-53+Math.floor(i/4)*3.1,w:2.5,d:2.2,height:.255})),
 // Two planters at the back of the dining hall.
 ...[-1,1].map(side=>({id:`dining-planter-${side}`,x:34+side*9.8,z:-34.6,w:1,d:1,height:1.8})),
];
