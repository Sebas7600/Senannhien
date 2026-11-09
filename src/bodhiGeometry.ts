import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {coloredGeometry,batchGeometry,barkTube} from './geometryBatch';
import {BODHI} from './bodhiData';
import {treeBasinParts} from './treeBasinGeometry';
import {forkedLimb} from './treeBranches';
const bark:THREE.BufferGeometry[]=[],stone:THREE.BufferGeometry[]=[],metal:THREE.BufferGeometry[]=[],offerings:THREE.BufferGeometry[]=[];
const trunk=barkTube([[0,.12,0],[-.08,.65,.05],[.15,1.48,-.08],[-.06,2.52,.08],[-.28,3.83,.13],[-.51,5.31,.09],[-.88,6.43,-.26]],[1.15,.98,.83,.76,.60,.37,.1],11);
export const bodhiTrunkShadowGeometry=trunk.clone().setIndex(Array.from({length:trunk.attributes.position.count},(_,i)=>i));
bark.push(trunk);
bark.push(barkTube([[1.17,.09,-.81],[.82,.86,-.50],[.64,1.83,-.35],[.38,2.94,-.17],[.28,4.30,-.52]],[.5,.47,.38,.32,.13],8));
const scaffold=[
  [.26,2.36,3.80,3.74,.64],[1.62,2.77,3.94,3.76,.59],[2.93,3.21,3.31,3.36,.53],
  [4.39,2.82,4.02,3.56,.66],[5.45,3.96,2.88,3.34,.48],
].map(([angle,height,reach,rise,radius])=>forkedLimb([
  Math.sin(angle)*.26,height,Math.cos(angle)*.26,
],angle,reach,rise,radius,9));
scaffold.forEach(limb=>bark.push(...limb.geometry));
for(let i=0;i<8;i++){const a=i*Math.PI/4+.15,dx=Math.sin(a),dz=Math.cos(a),length=2.1+(i%3)*.2;
  const width=.31+(i%3)*.07;
  bark.push(barkTube([[dx*.33,1.45+(i%3)*.39,dz*.33],[dx*.8,.66,dz*.8],[dx*1.58+dz*.16,.27,dz*1.58-dx*.16],[dx*length,.10,dz*length]],[width,width*.81,width*.48,.032],7));
  if(i%2===0)bark.push(barkTube([[dx*.78,.68,dz*.78],[dx*1.28+dz*.35,.28,dz*1.28-dx*.35],[dx*1.94+dz*.6,.1,dz*1.94-dx*.6]],[width*.53,width*.33,.025],5));
}
scaffold.forEach(({fork,tip},branch)=>{
  for(let i=0;i<3;i++){
    const t=.045+i*.078,x=THREE.MathUtils.lerp(fork[0],tip[0],t),y=THREE.MathUtils.lerp(fork[1],tip[1],t),z=THREE.MathUtils.lerp(fork[2],tip[2],t);
    if(z>1.8&&Math.abs(x)<1.15)continue;
    const lean=.14*Math.sin(branch*2.3+i),radius=.025+i*.018;
    bark.push(barkTube([[x,y,z],[x+lean,y*.57,z+.06],[x*.93,.64,z*.94],[x*.88,.12,z*.9]],[radius*.76,radius*.92,radius,radius*.88],5));
    if(i===0)offerings.push(coloredGeometry(new THREE.CylinderGeometry(.04,.04,.17,4),branch%2?'#9a4430':'#b3974e',[x*.97+lean*.6,1.8,z*.97]));
  }
});
stone.push(coloredGeometry(new THREE.CylinderGeometry(2.94,2.94,.075,28),'#594a34',[0,.05,0]));
stone.push(...treeBasinParts(BODHI.radius,BODHI.wallHeight,32));
function block(size:[number,number,number],position:[number,number,number],color:string){stone.push(coloredGeometry(new RoundedBoxGeometry(...size,1,.02),color,position));}
block([1.62,.13,.76],[0,.775,BODHI.altarZ],'#c1c0ae');
block([1.34,.51,.58],[0,.445,BODHI.altarZ],'#a5a796');
block([1.56,.14,.72],[0,.145,BODHI.altarZ],'#8f9688');
block([1.04,.30,.018],[0,.46,BODHI.altarZ+.301],'#8c9587');
// Small lotus relief on the front panel; the same material/geometry batch.
for(let i=-2;i<=2;i++)stone.push(coloredGeometry(new THREE.SphereGeometry(1,6,4),'#bbc0aa',[i*.062,.46+(2-Math.abs(i))*.018,BODHI.altarZ+.316],[.045,.085,.01],[0,0,-i*.35]));
const urnProfile=[[.07,0],[.105,.025],[.115,.055],[.175,.10],[.19,.17],[.175,.215],[.20,.225],[.20,.242],[.16,.245]].map(([r,y])=>new THREE.Vector2(r,y));
metal.push(coloredGeometry(new THREE.LatheGeometry(urnProfile,16),'#8a7650',[0,BODHI.altarHeight,BODHI.altarZ]));
metal.push(coloredGeometry(new THREE.CylinderGeometry(.161,.161,.014,16),'#9d906e',[0,1.077,BODHI.altarZ]));
for(const side of [-1,1])metal.push(coloredGeometry(new THREE.TorusGeometry(.062,.012,4,10),'#887247',[side*.205,.991,BODHI.altarZ],[1,1,1],[0,Math.PI/2,0]));
for(let i=0;i<3;i++){const a=i*Math.PI*2/3;metal.push(coloredGeometry(new THREE.SphereGeometry(.03,6,4),'#786443',[Math.sin(a)*.08,.858,BODHI.altarZ+Math.cos(a)*.08],[1,.8,1]));}
for(const side of [-1,1]){
  metal.push(coloredGeometry(new THREE.CylinderGeometry(.105,.08,.035,12),'#aaa895',[side*.57,.86,BODHI.altarZ]));
  for(let j=0;j<2;j++)offerings.push(coloredGeometry(new THREE.IcosahedronGeometry(.077,1),j?'#dfac43':'#cf862b',[side*.57+j*.025,.94+j*.085,BODHI.altarZ]));
  offerings.push(coloredGeometry(new THREE.SphereGeometry(1,5,3),'#53723b',[side*.62,1.03,BODHI.altarZ],[.065,.014,.028],[0,.5,.5]));
}
export const bodhiBarkGeometry=batchGeometry(bark),bodhiStoneGeometry=batchGeometry(stone),bodhiMetalGeometry=batchGeometry(metal),bodhiOfferingsGeometry=batchGeometry(offerings);
const rods=[coloredGeometry(new THREE.CylinderGeometry(.006,.006,.30,4),'#766044',[0,.15,0]),coloredGeometry(new THREE.CylinderGeometry(.0065,.0065,.075,4),'#a73e2c',[0,.035,0]),coloredGeometry(new THREE.SphereGeometry(.008,4,3),'#db9f59',[0,.301,0])];
export const incenseStickGeometry=batchGeometry(rods);
