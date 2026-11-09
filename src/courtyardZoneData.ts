import {gateAvenueTrees,pathLamps} from './courtyardPropsData';

type Side = 'north' | 'south' | 'west' | 'east';
type Opening = [side:Side, center:number, width:number];
type Surface = 'stone' | 'clay' | 'soil';

export interface CourtyardZone {
  id:string;
  bounds:[west:number, east:number, north:number, south:number];
  openings:Opening[];
  surface?:Surface;
  tint?:string;
}

// East is +X and south (toward the tam quan) is +Z.
export const bambooZoneBounds:[number,number,number,number]=[-54.5,-21.5,-3.2,28.9];
export const courtyardZones:CourtyardZone[]=[
  {id:'courtyard',bounds:[-15.5,15.5,-2.7,25.4],openings:[['north',0,7.6],['south',0,7.6],['west',8,5],['east',8,5]],surface:'stone',tint:'#d6d6b6'},
  {id:'hall',bounds:[-46,-20,-29.5,-8.6],openings:[['south',-33,6],['north',-33,6],['west',-19.05,4],['east',-19.05,4]],surface:'clay',tint:'#c09e85'},
  {id:'dining',bounds:[19,49,-40.6,-17],openings:[['south',34,6.5],['north',34,10.6],['west',-32.5,4]],surface:'clay',tint:'#e4be9f'},
  {id:'library',bounds:[-46.5,-21.5,-54,-35.2],openings:[['south',-34,6],['east',-44.6,4],['west',-44.6,4]],surface:'stone',tint:'#d9cbae'},
  {id:'garden',bounds:[20.6,47.5,-58,-42.2],openings:[['south',32.5,6.2],['west',-46.8,4.8]],surface:'soil',tint:'#c9a47d'},
  {id:'terrace',bounds:[-13.5,13.5,-64.5,-46.6],openings:[['south',0,6.2],['west',-53,3.5],['east',-53,3.5]],surface:'clay',tint:'#c8b596'},
  {id:'pond',bounds:[19,47,-2.8,22.6],openings:[['west',9,5.2],['east',9,5.2],['north',31,7.2],['south',33,4]],surface:'stone',tint:'#aabeb0'},
  {id:'quan-am',bounds:[36.5,48.2,23.5,28.6],openings:[['west',25.7,3.4]],surface:'clay',tint:'#d7c9a9'},
  {id:'lotus',bounds:[15.3,46.9,29.4,52.5],openings:[['west',39,5.8],['east',39,5.8],['north',17.65,3.4],['south',17.65,3.4],['south',28,4.4]],surface:'stone',tint:'#b9c7a1'},
  {id:'stupa',bounds:[-46,-24,33,53.5],openings:[['north',-35,5],['east',43.25,4.6],['south',-35,5]],surface:'soil',tint:'#c4b19a'},
  {id:'bamboo',bounds:bambooZoneBounds,openings:[['east',12,5.5],['north',-38,4.8],['south',-38,4.8]]},
];

export const fenceDepth=.28;
export const fenceHeight=.82;
const sides:Side[]=['north','south','west','east'];
// The shared lake replaces the old pond/lotus zones; keep its shores and bridge approaches clear.
export const zoneFences=courtyardZones.filter(zone=>!['pond','lotus','quan-am'].includes(zone.id)).flatMap(zone=>sides.filter(side=>!(zone.id==='courtyard'&&side==='east')).flatMap(side=>{
  const [west,east,north,south]=zone.bounds;
  const horizontal=side==='north'||side==='south';
  const fixed=side==='north'?north:side==='south'?south:side==='west'?west:east;
  const min=horizontal?west:north,max=horizontal?east:south;
  const openings=zone.openings.filter(([edge])=>edge===side).sort((a,b)=>a[1]-b[1]);
  const spans:[number,number,boolean,boolean][]=[];
  let from=min;
  for(const [,center,width] of openings){
    const left=center-width/2,right=center+width/2;
    if(left>from+.1)spans.push([from,left,from!==min,true]);
    from=right;
  }
  if(max>from+.1)spans.push([from,max,from!==min,false]);
  return spans.map(([from,to,entryStart,entryEnd])=>{
    const center=(from+to)/2,length=to-from;
    return {id:zone.id,side,fixed,horizontal,from,to,entryStart,entryEnd,length,
      x:horizontal?center:fixed,z:horizontal?fixed:center,
      w:horizontal?length:fenceDepth,d:horizontal?fenceDepth:length};
  });
}));

// Pots sit beside walls, paired outside doorways and away from the stair run.
const buildings=[
  {x:0,z:-27,side:14.95,back:-7.2,front:13.2,door:8.6},
  {x:-33,z:-17,side:10.65,back:-5.6,front:8.95,door:5.4},
  {x:-34,z:-43,side:9.25,back:-4.6,front:7.9,door:5.2},
  {x:34,z:-27,side:12.2,back:-2.1,front:9.8,door:5.8},
  {x:0,z:-56,side:10.8,back:-4.7,front:7.55,door:5.65},
];
export const buildingPlanters=buildings.flatMap((p,building)=>[-1,1].flatMap(sign=>[
  {x:p.x+sign*p.door,z:p.z+p.front,variant:building%3},
  {x:p.x+sign*p.side,z:p.z+p.back,variant:(building+1)%3},
])).map((p,i)=>({...p,radius:.44+(i%3)*.05,angle:i*2.399}));

export const zoneObstacles=[
  ...zoneFences.map(({x,z,w,d})=>({x,z,w,d,height:fenceHeight})),
  ...buildingPlanters.map(({x,z,radius})=>({x,z,w:radius*2,d:radius*2,height:.8})),
  ...gateAvenueTrees.map(({x,z})=>({x,z,w:.66,d:.66,height:2.2})),
  ...pathLamps.map(({x,z})=>({x,z,w:.3,d:.3,height:1.08})),
];
