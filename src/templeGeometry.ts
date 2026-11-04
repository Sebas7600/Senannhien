import * as THREE from 'three';
export function templeParts(geometry:THREE.BufferGeometry){
 const p=geometry.attributes.position,ix=geometry.index!;const parents=Array.from({length:p.count},(_,i)=>i),find=(x:number):number=>parents[x]===x?x:parents[x]=find(parents[x]),join=(a:number,b:number)=>parents[find(a)]=find(b),positions=new Map<string,number>();
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(3)).join(',');const old=positions.get(key);if(old!==undefined)join(i,old);else positions.set(key,i)}
 for(let i=0;i<ix.count;i+=3){join(ix.getX(i),ix.getX(i+1));join(ix.getX(i),ix.getX(i+2))}
 const parts=new Map<number,{box:THREE.Box3;indices:number[]}>();for(let i=0;i<ix.count;i+=3){const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)],root=find(ids[0]);if(!parts.has(root))parts.set(root,{box:new THREE.Box3(),indices:[]});const part=parts.get(root)!;part.indices.push(...ids);for(const id of ids)part.box.expandByPoint(new THREE.Vector3().fromBufferAttribute(p,id))}return [...parts.values()];
}

/** Seal exposed boundaries after removing the original baked arm pose. */
export function closeCutSurface(geometry:THREE.BufferGeometry){
 const p=geometry.attributes.position,ix=geometry.index!;const canonical:number[]=[],weld=new Map<string,number>(),positions:number[]=[];
 for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(4)).join(',');if(!weld.has(key))weld.set(key,i);canonical[i]=weld.get(key)!;}
 const edges=new Map<string,{from:number;to:number;count:number}>(),indices=Array.from(ix.array);
 for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){const from=canonical[indices[i+j]],to=canonical[indices[i+(j+1)%3]];if(from===to)continue;const key=from<to?from+':'+to:to+':'+from;const edge=edges.get(key);if(edge)edge.count++;else edges.set(key,{from,to,count:1});}
 const boundary=[...edges.values()].filter(e=>e.count===1),adjacent=new Map<number,number[]>();for(const e of boundary){for(const [a,b] of [[e.from,e.to],[e.to,e.from]]){if(!adjacent.has(a))adjacent.set(a,[]);adjacent.get(a)!.push(b)}}
 const visited=new Set<number>();for(const start of adjacent.keys()){if(visited.has(start))continue;const queue=[start],component=new Set<number>();while(queue.length){const id=queue.pop()!;if(visited.has(id))continue;visited.add(id);component.add(id);queue.push(...(adjacent.get(id)||[]));}if(component.size<3)continue;const centre=new THREE.Vector3();for(const id of component)centre.add(new THREE.Vector3().fromBufferAttribute(p,id));centre.divideScalar(component.size);const id=positions.length/3;positions.push(centre.x,centre.y,centre.z);for(const edge of boundary)if(component.has(edge.from))indices.push(edge.to,edge.from,id);}
 const sealed=new THREE.BufferGeometry();sealed.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));sealed.setIndex(indices);sealed.computeVertexNormals();sealed.computeBoundingSphere();return sealed;
}
