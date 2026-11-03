import * as THREE from 'three';
// A shared canopy of curved leaves: one draw call per tree, no alpha overdraw.
export const canopyGeometry=(()=>{const positions:number[]=[],colors:number[]=[],indices:number[]=[];const color=new THREE.Color();let seed=4817;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const rotation=new THREE.Euler(),q=new THREE.Quaternion(),v=new THREE.Vector3();
for(let i=0;i<780;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*2.5,y=3.55+(random()-.5)*1.8-Math.pow(r/2.5,2)*.45,x=Math.cos(a)*r,z=Math.sin(a)*r*.82;rotation.set((random()-.5)*1.7,random()*6.28,random()*.7);q.setFromEuler(rotation);const length=.18+random()*.23,width=length*.43,base=positions.length/3;
const points=[[-width,0,0],[0,.03,length*.56],[width,0,0],[0,-.025,-length*.56],[0,.045,0]];color.setHSL(.23+random()*.075,.20+random()*.16,.23+random()*.18);
for(const p of points){v.set(p[0],p[1],p[2]).applyQuaternion(q).add(new THREE.Vector3(x,y,z));positions.push(v.x,v.y,v.z);colors.push(color.r,color.g,color.b)}for(let j=0;j<4;j++)indices.push(base+j,base+(j+1)%4,base+4);}
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;})();
export const foliageMaterial=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.95});
