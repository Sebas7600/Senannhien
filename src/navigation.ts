import {WORLD,distance,walkable,type Vec2} from './gameData';

// The finer grid fits the aisles between individual library desks.
const STEP=.625;
const cell=(p:Vec2):Vec2=>[Math.round(p[0]/STEP),Math.round(p[1]/STEP)];
const key=(p:Vec2)=>`${p[0]},${p[1]}`;
type QueueEntry={id:string;score:number};
class Frontier {
  entries:QueueEntry[]=[];
  push(entry:QueueEntry){
    const a=this.entries;let i=a.length;a.push(entry);
    while(i>0){const parent=(i-1)>>1;if(a[parent].score<=entry.score)break;a[i]=a[parent];i=parent;}a[i]=entry;
  }
  pop(){
    const a=this.entries,first=a[0],last=a.pop();
    if(a.length&&last){let i=0;while(i*2+1<a.length){let child=i*2+1;if(child+1<a.length&&a[child+1].score<a[child].score)child++;if(last.score<=a[child].score)break;a[i]=a[child];i=child;}a[i]=last;}
    return first;
  }
}
function freeCell(p:Vec2):Vec2 {
  const center=cell(p),targetIsWalkable=walkable(...p);
  for(let r=0;r<14;r++){
    const candidates:Vec2[]=[];
    for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
      if(r&&Math.abs(dx)!==r&&Math.abs(dz)!==r)continue;
      const c:Vec2=[center[0]+dx,center[1]+dz],world:Vec2=[c[0]*STEP,c[1]*STEP];
      if(walkable(...world)&&(!targetIsWalkable||clearLine(world,p)))candidates.push(c);
    }
    if(candidates.length)return candidates.sort((a,b)=>distance([a[0]*STEP,a[1]*STEP],p)-distance([b[0]*STEP,b[1]*STEP],p))[0];
  }
  return center;
}
export function findPath(start:Vec2,destination:Vec2):Vec2[] {
  const target:Vec2=[Math.max(WORLD.minX+2,Math.min(WORLD.maxX-2,destination[0])),Math.max(WORLD.minZ+2,Math.min(WORLD.maxZ-2,destination[1]))];
  if(walkable(...start)&&walkable(...target)&&clearLine(start,target))return [target];
  const s=freeCell(start),g=freeCell(target),goal=key(g),frontier=new Frontier();
  const nodes=new Map<string,{p:Vec2;cost:number;score:number;from?:string}>();
  nodes.set(key(s),{p:s,cost:0,score:distance(s,g)});frontier.push({id:key(s),score:distance(s,g)});
  let count=0;
  while(frontier.entries.length&&count++<18000){
    const current=frontier.pop()!,n=nodes.get(current.id)!;
    if(current.score!==n.score)continue;
    if(current.id===goal){
      const path:Vec2[]=[];let at:string|undefined=current.id;
      while(at){const step:{p:Vec2;cost:number;from?:string}=nodes.get(at)!;path.unshift([step.p[0]*STEP,step.p[1]*STEP]);at=step.from;}
      path.shift();if(walkable(...target))path.push(target);return simplify(path,start);
    }
    for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]]){
      const p:Vec2=[n.p[0]+dx,n.p[1]+dz];if(!walkable(p[0]*STEP,p[1]*STEP))continue;
      if(dx&&dz&&(!walkable((n.p[0]+dx)*STEP,n.p[1]*STEP)||!walkable(n.p[0]*STEP,(n.p[1]+dz)*STEP)))continue;
      const id=key(p),cost=n.cost+Math.hypot(dx,dz),existing=nodes.get(id);if(existing&&existing.cost<=cost)continue;
      const score=cost+distance(p,g);nodes.set(id,{p,cost,score,from:current.id});frontier.push({id,score});
    }
  }
  return [];
}
export function clearLine(a:Vec2,b:Vec2){
  const steps=Math.ceil(distance(a,b)/.4);
  for(let i=1;i<=steps;i++){const t=i/steps;if(!walkable(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false;}
  return true;
}
function simplify(path:Vec2[],start:Vec2){
  if(path.length<3)return path;
  const result:Vec2[]=[];let from=start;
  for(let i=0;i<path.length;i++){if(i===path.length-1||!clearLine(from,path[i+1])){result.push(path[i]);from=path[i];}}
  return result;
}
