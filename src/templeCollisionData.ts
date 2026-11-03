import {removedTemplePost} from './templeLayout';
import objectShapes from './templeObjectColliders.json';
export type TempleCollider={kind:'box'|'cylinder';position:[number,number,number];args:[number,number,number]|[number,number];rotationX?:number};
const allTempleColliders:TempleCollider[]=[
 ...objectShapes.map(s=>({...s,kind:s.kind as 'box'|'cylinder',position:s.position as [number,number,number],args:s.args as [number,number,number]})),
 {kind:'box',position:[0,1.05,.625],args:[14.25,1.15,10.375]},
 {kind:'box',position:[0,1.1,13.75],rotationX:Math.atan2(2.2,5.5),args:[9.2,.08,Math.hypot(5.5,2.2)/2]},
 ...[-1,1].flatMap(side=>[
 {kind:'box' as const,position:[side*13.8,4.2,0] as [number,number,number],args:[.25,2,9.25] as [number,number,number]},
 {kind:'box' as const,position:[side*7.7,4.2,8.9] as [number,number,number],args:[6.1,2,.25] as [number,number,number]},
 {kind:'box' as const,position:[side*14.15,2.8,.6] as [number,number,number],args:[.12,.65,10.4] as [number,number,number]},
 {kind:'box' as const,position:[side*11.7,2.8,11] as [number,number,number],args:[2.5,.65,.12] as [number,number,number]}
 ]),
 {kind:'box',position:[0,4.2,-9.5],args:[14,2,.25]},
 {kind:'box',position:[0,4.2,-4.3],args:[7.1,2,3]},
 ...[-11.5,-7.025,-2.35,2.35,7.025,11.5].flatMap(x=>[-6.75,-3.4,1,4.9].map(z=>({kind:'cylinder' as const,position:[x,5.2,z] as [number,number,number],args:[3,.3] as [number,number]}))),
 ...[-13.1,-7.025,-2.35,2.35,7.025,13.1].flatMap(x=>[-8.9,8.9].map(z=>({kind:'cylinder' as const,position:[x,4.3,z] as [number,number,number],args:[2.1,.3] as [number,number]})))
];

export const templeColliders=allTempleColliders.filter(s=>!(removedTemplePost(s.position[0],s.position[2])&&(s.kind==='cylinder'||(s.args[0]<1.5&&(s.args[2]||0)<1.5))));
