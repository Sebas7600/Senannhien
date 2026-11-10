import * as THREE from 'three';
import {GATE} from './courtyardPropsData';
import {fireworkVolleySchedule} from './fireworksSchedule';

type Particle={direction:THREE.Vector3;speed:number;life:number;color:THREE.Color;size:number};
type Launch={at:number;origin:THREE.Vector3;target:THREE.Vector3;flight:number;style:number;particles:Particle[]};
const palettes=[['#ff5733','#ff9b45','#ffd092','#ff456c'],['#ffe85a','#7dff71','#63b8ff','#ffffff','#ff8bc3'],['#a06bff','#ddadff','#f4edff','#797cff'],['#ffcf65','#f5a935','#ffe7a2','#fff5d8'],['#ff304c','#ff762e','#a15dff','#59baff'],['#ffcf54','#ff9d35','#fff1b5','#a9dfff'],['#ef344c','#ff6652','#9dff53','#ffdb73']];
// Ten launch tubes line the main gate approach: five on each side of the road.
export const launchTubes=([-1,1] as const).flatMap(side=>[4,8,12,16,20].map(distance=>({side,x:side*6.4,z:GATE.z-distance})));
export const companySlides=[
 {file:'mac-usa-one-logo.png',alt:'MAC USA ONE',start:10,end:20,fireworkStyle:3},
 {file:'hoang-nguyen.png',alt:'HOANG NGUYEN — Attorney Legal Advisor',start:20,end:30,fireworkStyle:5},
 {file:'sang-ngo.png',alt:'SANG NGO — Senior Advisor',start:30,end:40,fireworkStyle:2},
 {file:'hieu-nguyen.png',alt:'HIEU NGUYEN — President',start:40,end:50,fireworkStyle:2},
 {file:'viet-pham.png',alt:'VIET PHAM — Vietnam General Director',start:50,end:60,fireworkStyle:5},
] as const;
function rng(seed:number){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export function makeFireworksPlan(seed:number,quality:'high'|'low',companyPresentationEnabled=false){
 const random=rng(seed),plan:Launch[]=[];
 const add=(at:number,tube:typeof launchTubes[number],style:number,targetOverride?:THREE.Vector3,flightOverride?:number)=>{const origin=new THREE.Vector3(tube.x,.75,tube.z),target=targetOverride?.clone()??new THREE.Vector3(-43+random()*86,20+random()*22,-50+random()*88);const density=random(),count=142+Math.floor(density*75),visibleCount=quality==='low'?76+Math.floor(density*35):count,flight=flightOverride??1.25+random()*.85;const particleRandom=rng(Math.floor(random()*0x100000000)),colors=palettes[style];const particles=Array.from({length:count},(_,i)=>{const y=particleRandom()*2-1,a=particleRandom()*Math.PI*2,r=Math.sqrt(1-y*y);let direction=new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a));if(style===3)direction.y=-Math.abs(direction.y)*.82-.16;if(style===5&&i%3===0)direction.y=Math.abs(direction.y)*1.25;if(style===6){direction.y=direction.y*.55-.1;direction.x*=1.2;}const c=new THREE.Color(colors[Math.floor(particleRandom()*colors.length)]);return{direction,speed:style===3?10+particleRandom()*8:style===5?14+particleRandom()*10:12+particleRandom()*14,life:style===3?3.2+particleRandom()*2.2:1.7+particleRandom()*1.8,color:c,size:1.3+particleRandom()*1.7}});plan.push({at,origin,target,flight,style,particles:particles.slice(0,visibleCount)});};
 // Start with one, three, and five shells; then alternate three and five until
 // each minute mark, when all ten tubes fire together.
 for(const volley of fireworkVolleySchedule()){
  const available=[...launchTubes];
  for(let i=available.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[available[i],available[j]]=[available[j],available[i]];}
  for(let i=0;i<volley.count;i++)add(volley.at,available[i%available.length],Math.floor(random()*7));
 }
 if(companyPresentationEnabled){
  // Each of the five company slides receives its own paired launch that blooms
  // at the roof edges just as that logo/portrait fades in.
  const sideTubes=launchTubes.filter(tube=>tube.z<=GATE.z-16);
  for(const slide of companySlides){const flight=2.8;for(const side of [-1,1] as const){const tube=sideTubes.find(candidate=>candidate.side===side)!;const target=new THREE.Vector3(side*10,24+(slide.start%20===0?2:0),-27);add(slide.start-flight+(side===1?.12:0),tube,slide.fireworkStyle,target,flight);}}
 }
 return plan.sort((a,b)=>a.at-b.at);
}
