import * as THREE from 'three';
import {coloredGeometry} from './geometryBatch';
// Closed masonry wedges. Coping and body use a single merged vertex-colour batch.
export function treeBasinParts(radius:number,height:number,segments=24){
  const parts:THREE.BufferGeometry[]=[];
  for(let row=0;row<2;row++)for(let i=0;i<segments;i++){
    const a=i/segments*Math.PI*2+.0025,b=(i+1)/segments*Math.PI*2-.0025;
    const r0=radius-.29-(row?.025:0),r1=radius-(row?0:.035),y0=row?height-.10:.045,y1=row?height:height-.105;
    const p:number[]=[],idx:number[]=[];
    for(const y of [y0,y1])for(const [r,t] of [[r0,a],[r1,a],[r1,b],[r0,b]])p.push(Math.sin(t)*r,y,Math.cos(t)*r);
    for(const [a,b,c,d] of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])idx.push(a,b,c,a,c,d);
    const indexed=new THREE.BufferGeometry();indexed.setAttribute('position',new THREE.Float32BufferAttribute(p,3));indexed.setIndex(idx);
    const g=indexed.toNonIndexed();g.computeVertexNormals();
    parts.push(coloredGeometry(g,(row?['#b3b1a3','#bab8aa','#aaa99d','#bfbdaf']:['#92958a','#9d9f92','#888e83','#a3a598'])[i%4]));indexed.dispose();g.dispose();
  }
  return parts;
}
