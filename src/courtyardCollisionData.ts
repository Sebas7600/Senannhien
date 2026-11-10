import {souvenirSolids} from './souvenirData';
/** Lightweight solid proxies for decorations that previously had visuals only. */
export type CourtyardSolid={id:string;x:number;z:number;w:number;d:number;height:number;base?:number;rotation?:number;round?:boolean;bench?:boolean};
export const courtyardSolids:CourtyardSolid[]=[
 ...souvenirSolids,
 ...[[12,-40],[-13,-43],[47,-16],[-20,34]].map(([x,z],i)=>({id:`ornamental-tree-${i}`,x,z,w:.92,d:.92,height:3.19,round:true})),
 ...Array.from({length:30},(_,i)=>({id:`forest-trunk-${i}`,x:-47+Math.sin(i*2.4)*8,z:-5+i*1.6,w:.56*(.75+(i+145)%4*.18),d:.56*(.75+(i+145)%4*.18),height:3,round:true})),
 ...Array.from({length:24},(_,i)=>({id:`garden-rock-${i}`,x:(i%2===0?-1:1)*(53+Math.sin(i*1.7)*2),z:-56+Math.floor(i/2)*10,w:2*(.55+(i%3)*.18),d:1.3,height:.55+(i%4)*.13,round:true})),
 ...Array.from({length:12},(_,i)=>({id:`vegetable-bed-${i}`,x:31+(i%4)*3.1,z:-53+Math.floor(i/4)*3.1,w:2.5,d:2.2,height:.255})),
 // Two planters at the back of the dining hall.
 ...[-1,1].map(side=>({id:`dining-planter-${side}`,x:34+side*9.8,z:-34.6,w:1,d:1,height:1.8})),
];
