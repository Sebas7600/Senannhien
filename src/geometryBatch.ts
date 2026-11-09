import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** setMatrixAt does not invalidate cached bounds; refresh once after a static layout. */
export function finishInstanceLayout(mesh:THREE.InstancedMesh|null){
  if(!mesh)return;
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
}
export function coloredGeometry(source:THREE.BufferGeometry,color:string,position:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1],rotation:[number,number,number]=[0,0,0]){let g=source.clone();if(g.index)g=g.toNonIndexed();g.scale(...scale);g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);g.translate(...position);for(const key of Object.keys(g.attributes))if(key!=='position'&&key!=='normal')g.deleteAttribute(key);if(!g.attributes.normal)g.computeVertexNormals();const c=new THREE.Color(color),colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<g.attributes.position.count;i++){colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(colors,3));return g;}
export function batchGeometry(items:THREE.BufferGeometry[]){const merged=mergeGeometries(items,false)!,g=mergeVertices(merged,.00001);merged.dispose();items.forEach(i=>i.dispose());g.computeBoundingBox();g.computeBoundingSphere();return g;}
export function taperTube(points:[number,number,number][],radii:number[],sides=7){const p:number[]=[],indices:number[]=[],u=new THREE.Vector3(),v=new THREE.Vector3(),tangent=new THREE.Vector3();
  for(let i=0;i<points.length;i++){const center=new THREE.Vector3(...points[i]),a=new THREE.Vector3(...points[Math.max(0,i-1)]),b=new THREE.Vector3(...points[Math.min(points.length-1,i+1)]);tangent.copy(b).sub(a).normalize();u.crossVectors(tangent,Math.abs(tangent.y)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0)).normalize();v.crossVectors(tangent,u).normalize();for(let j=0;j<sides;j++){const angle=j/sides*Math.PI*2,r=radii[i];p.push(center.x+(u.x*Math.cos(angle)+v.x*Math.sin(angle))*r,center.y+(u.y*Math.cos(angle)+v.y*Math.sin(angle))*r,center.z+(u.z*Math.cos(angle)+v.z*Math.sin(angle))*r);}}
  for(let i=0;i<points.length-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=a+sides,d=b+sides;indices.push(a,b,c,b,d,c)}
  for(let j=1;j<sides-1;j++){indices.push(0,j+1,j);const n=(points.length-1)*sides;indices.push(n,n+j,n+j+1)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function barkTube(points:[number,number,number][],radii:number[],sides:number){
  const source=taperTube(points,radii,sides),indices=source.index!;
  const positions=source.getAttribute('position');
  points.forEach(([x,y,z],ring)=>{
    for(let side=0;side<sides;side++){
      const vertex=ring*sides+side,angle=side/sides*Math.PI*2;
      const flare=1+.13*Math.cos(angle*3+ring*.21)+.07*Math.sin(angle*2+.6);
      positions.setXYZ(vertex,x+(positions.getX(vertex)-x)*flare,y+(positions.getY(vertex)-y)*flare,z+(positions.getZ(vertex)-z)*flare);
    }
  });
  source.computeVertexNormals();
  const geometry=source.toNonIndexed(),uv=new Float32Array(indices.count*2);
  const tileLength=1.45,repeats=Math.max(1,Math.round(2*Math.PI*Math.max(...radii)/tileLength));
  const along=[0],a=new THREE.Vector3(),b=new THREE.Vector3();
  for(let ring=1;ring<points.length;ring++){
    along.push(along[ring-1]+a.set(...points[ring-1]).distanceTo(b.set(...points[ring]))/tileLength);
  }
  const sideIndexCount=(points.length-1)*sides*6;
  for(let i=0;i<indices.count;i++){
    const vertex=indices.getX(i),column=vertex%sides;
    if(i<sideIndexCount){
      // The last face wraps back to column zero. Give its seam the next whole U repeat.
      const seam=column===0&&Math.floor(i/6)%sides===sides-1;
      uv[i*2]=(seam?sides:column)/sides*repeats;
      uv[i*2+1]=along[Math.floor(vertex/sides)];
    }else{
      const angle=column/sides*Math.PI*2;
      uv[i*2]=.5+.5*Math.cos(angle);
      uv[i*2+1]=.5+.5*Math.sin(angle);
    }
  }
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  source.dispose();
  return geometry;
}
