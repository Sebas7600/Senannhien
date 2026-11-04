import * as T from 'three';import {coloredGeometry as c,batchGeometry,taperTube} from './geometryBatch';
const stone:T.BufferGeometry[]=[],bronze:T.BufferGeometry[]=[],ceramic:T.BufferGeometry[]=[],flowers:T.BufferGeometry[]=[],green:T.BufferGeometry[]=[];
const box=(p:[number,number,number],s:[number,number,number],color:string)=>c(new T.BoxGeometry(1,1,1),color,p,s);
stone.push(c(new T.CylinderGeometry(1.50,1.62,.18,32),'#a8ada2',[0,.09,0]),c(new T.CylinderGeometry(1.30,1.45,.30,32),'#c0c4b6',[0,.33,0]),c(new T.CylinderGeometry(1.38,1.34,.08,32),'#e1deca',[0,.52,0]));
// Local +Z is the worshipper-facing side; the whole shrine rotates toward the west path.
stone.push(box([0,.16,2.7],[2.35,.20,.98],'#b7beb1'),box([0,.62,2.7],[2.03,.76,.76],'#9da89b'),box([0,1.04,2.7],[2.42,.14,1.02],'#d6d7c6'),box([0,.64,3.09],[1.6,.44,.025],'#758c7e'));
for(let i=-3;i<=3;i++)bronze.push(c(new T.SphereGeometry(1,7,5),'#c6b78a',[i*.115,.61+(3-Math.abs(i))*.03,3.115],[.075,.15,.014],[0,0,-i*.3]));
const urn=[[.12,0],[.19,.025],[.22,.07],[.26,.15],[.27,.23],[.30,.255],[.30,.28],[.24,.285],[.23,.23]].map(([r,y])=>new T.Vector2(r,y));bronze.push(c(new T.LatheGeometry(urn,20),'#8b7953',[0,1.11,2.7]),c(new T.CylinderGeometry(.235,.235,.012,20),'#a8997c',[0,1.30,2.7]));
for(const side of [-1,1]){bronze.push(c(new T.TorusGeometry(.085,.018,5,12),'#a58b56',[side*.30,1.27,2.7],[1,1,1],[0,Math.PI/2,0]));
 const x=side*2.05,z=1.1,profile=[[.18,0],[.26,.05],[.33,.37],[.30,.57],[.15,.77],[.14,.92],[.20,.96],[.20,1],[.15,1]].map(([r,y])=>new T.Vector2(r,y));ceramic.push(c(new T.LatheGeometry(profile,20),'#e7e8d7',[x,0,z]));
 for(const y of [.09,.73,.96])ceramic.push(c(new T.TorusGeometry(y<.2?.25:y<.8?.17:.20,.012,4,20),'#527b88',[x,y,z],[1,1,1],[Math.PI/2,0,0]));
 for(let k=0;k<6;k++){const a=k/6*Math.PI*2;ceramic.push(c(new T.SphereGeometry(1,6,4),'#7294a0',[x+Math.sin(a)*.315,.38,z+Math.cos(a)*.315],[.05,.15,.018],[0,a,0]));}
 for(let k=0;k<5;k++){const dx=Math.sin(k*2.4)*.22,dz=Math.cos(k*2.4)*.19,y=1.35+(k%3)*.16;green.push(c(taperTube([[x,.75,z],[x+dx*.4,1.12,z+dz*.4],[x+dx,y,z+dz]],[.013,.011,.008],5),'#6e8c57'));
  for(let j=0;j<7;j++){const a=j/7*Math.PI*2;flowers.push(c(new T.SphereGeometry(1,6,4),k%2?'#f0e7cb':'#dcafac',[x+dx+Math.sin(a)*.075,y,z+dz+Math.cos(a)*.075],[.055,.11,.065],[Math.cos(a)*.5,0,-Math.sin(a)*.5]));}flowers.push(c(new T.SphereGeometry(.045,6,4),'#c9ad67',[x+dx,y+.02,z+dz]));
  green.push(c(new T.SphereGeometry(1,6,4),'#7d995d',[x+dx*.6+.08,1.12,z+dz*.6],[.16,.022,.055],[0,k,.45]));
 }
}
export const quanAmStoneGeometry=batchGeometry(stone),quanAmBronzeGeometry=batchGeometry(bronze),quanAmCeramicGeometry=batchGeometry(ceramic),quanAmFlowersGeometry=batchGeometry(flowers),quanAmGreenGeometry=batchGeometry(green);
export const altarStoneMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.83}),altarBronzeMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.46,metalness:.64}),altarCeramicMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.04}),altarFlowerMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.85});
