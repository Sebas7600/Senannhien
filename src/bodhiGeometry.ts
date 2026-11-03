import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {coloredGeometry,batchGeometry,taperTube} from './geometryBatch';
import {BODHI} from './bodhiData';
import {treeBasinParts} from './treeBasinGeometry';
const bark:THREE.BufferGeometry[]=[],stone:THREE.BufferGeometry[]=[],metal:THREE.BufferGeometry[]=[],offerings:THREE.BufferGeometry[]=[];
const trunk=taperTube([[0,.12,0],[.06,.55,0],[-.08,1.4,.04],[.05,2.7,-.05],[.1,3.9,.03],[.1,4.8,0]],[.98,.87,.66,.56,.42,.23],10);
bark.push(coloredGeometry(trunk,'#70583d'));
for(let i=0;i<8;i++){const a=i*Math.PI/4+.15,dx=Math.sin(a),dz=Math.cos(a),length=2.1+(i%3)*.2;
  bark.push(coloredGeometry(taperTube([[dx*.3,1.6,dz*.3],[dx*.75,.65,dz*.75],[dx*1.5,.22,dz*1.5],[dx*length,.1,dz*length]],[.35,.32,.19,.045],7),i%2?'#71593e':'#66513b'));
  bark.push(coloredGeometry(taperTube([[dx*.16,3.3,dz*.16],[dx*.9,4.25+(i%2)*.3,dz*.9],[dx*2.1,5.0+(i%3)*.3,dz*2.1],[dx*3.0,5.5+(i%2)*.5,dz*3]],[.31,.27,.16,.055],7),'#756044'));
}
for(let i=0;i<18;i++){const a=i*2.399,r=2.5+(i%4)*.25,x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(z>1.8&&Math.abs(x)<1.15)continue;
  bark.push(coloredGeometry(taperTube([[x,5.7+(i%3)*.32,z],[x+.08*Math.sin(i),2.8,z+.05],[x+.10,.14,z]],[.022,.026,.043],4),'#806448'));
  if(i%3===0)bark.push(coloredGeometry(new THREE.CylinderGeometry(.035,.036,.17,4),i%2?'#9a4430':'#b3974e',[x+.05,1.6+(i%2)*.5,z]));
}
bark.push(coloredGeometry(new THREE.CylinderGeometry(2.94,2.94,.075,28),'#594a34',[0,.05,0]));
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
