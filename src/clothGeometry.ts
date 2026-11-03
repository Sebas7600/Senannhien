import * as THREE from 'three';
/** Radial cloth surface with longitudinal folds; authored once, reused by the articulated rig. */
export function clothGeometry(profile:[number,number][],folds=12,amplitude=.004,depth=.72){const positions:number[]=[],uv:number[]=[],indices:number[]=[],rings=profile.length,segments=96;
  for(let row=0;row<rings;row++){const[y,r]=profile[row];for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2,wave=Math.sin(a*folds+row*.23)*amplitude*(.4+r*2)+Math.sin(a*folds*2)*amplitude*.2;positions.push(Math.cos(a)*(r+wave),y,Math.sin(a)*(r+wave)*depth);uv.push(j/segments,row/(rings-1));}}
  for(let i=0;i<rings-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
export const torsoCloth=clothGeometry([[0,.185],[.10,.183],[.2,.197],[.31,.217],[.40,.222],[.46,.20],[.50,.15],[.54,.075],[.57,.072]],12,.004,.7);
export const skirtCloth=clothGeometry([[.15,.25],[.25,.245],[.4,.231],[.55,.214],[.7,.20],[.85,.185]],12,.006,.72);
export const sleeveCloth=clothGeometry([[-.19,.01],[-.12,.58],[0,.78],[.15,.79],[.35,.76],[.65,.69],[.9,.63],[1,.63]],7,.006,1);
