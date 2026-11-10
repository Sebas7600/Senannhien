import {Html} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import {useMemo, useRef, useEffect} from 'react';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {GATE} from './courtyardPropsData';
import {fireworkVolleySchedule} from './fireworksSchedule';

type Particle={direction:THREE.Vector3;speed:number;life:number;color:THREE.Color;size:number};
type Launch={at:number;origin:THREE.Vector3;target:THREE.Vector3;flight:number;style:number;particles:Particle[]};
const palettes=[['#ff5733','#ff9b45','#ffd092','#ff456c'],['#ffe85a','#7dff71','#63b8ff','#ffffff','#ff8bc3'],['#a06bff','#ddadff','#f4edff','#797cff'],['#ffcf65','#f5a935','#ffe7a2','#fff5d8'],['#ff304c','#ff762e','#a15dff','#59baff'],['#ffcf54','#ff9d35','#fff1b5','#a9dfff'],['#ef344c','#ff6652','#9dff53','#ffdb73']];
// Ten launch tubes line the main gate approach: five on each side of the road.
const launchTubes=([-1,1] as const).flatMap(side=>[4,8,12,16,20].map(distance=>({side,x:side*6.4,z:GATE.z-distance})));
const companySlides=[
 {key:'logo',file:'mac-usa-one-logo.gif',alt:'MAC USA ONE animated fireworks logo',start:10,end:20,fireworkStyle:3},
 {key:'hoang',file:'hoang-nguyen.png',alt:'HOANG NGUYEN — Attorney Legal Advisor',start:20,end:30,fireworkStyle:5},
 {key:'sang',file:'sang-ngo.png',alt:'SANG NGO — Senior Advisor',start:30,end:40,fireworkStyle:2},
 {key:'hieu',file:'hieu-nguyen.png',alt:'HIEU NGUYEN — President',start:40,end:50,fireworkStyle:2},
 {key:'viet',file:'viet-pham.png',alt:'VIET PHAM — Vietnam General Director',start:50,end:60,fireworkStyle:5},
] as const;
const companyAsset=(file:string)=>`/assets/fireworks/company/${file}?v=20261110-animated-gold-set-1`;
const companyLogoFrames=Array.from({length:6},(_,index)=>`mac-usa-one-logo-frame-${index}.png`);
function rng(seed:number){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function makePlan(seed:number,quality:'high'|'low',companyPresentationEnabled=false){
 const random=rng(seed),plan:Launch[]=[];
 const add=(at:number,tube:typeof launchTubes[number],style:number,targetOverride?:THREE.Vector3,flightOverride?:number)=>{const origin=new THREE.Vector3(tube.x,.75,tube.z),target=targetOverride?.clone()??new THREE.Vector3(-43+random()*86,20+random()*22,-50+random()*88);const count=(quality==='low'?76:142)+Math.floor(random()*(quality==='low'?35:75)),flight=flightOverride??1.25+random()*.85;const colors=palettes[style];const particles=Array.from({length:count},(_,i)=>{const y=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-y*y);let direction=new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a));if(style===3)direction.y=-Math.abs(direction.y)*.82-.16;if(style===5&&i%3===0)direction.y=Math.abs(direction.y)*1.25;if(style===6){direction.y=direction.y*.55-.1;direction.x*=1.2;}const c=new THREE.Color(colors[Math.floor(random()*colors.length)]);return{direction,speed:style===3?10+random()*8:style===5?14+random()*10:12+random()*14,life:style===3?3.2+random()*2.2:1.7+random()*1.8,color:c,size:1.3+random()*1.7}});plan.push({at,origin,target,flight,style,particles});};
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
function makeSparkMaterial(sizeScale:number,opacity:number,glow:number){return new THREE.ShaderMaterial({uniforms:{uSizeScale:{value:sizeScale},uOpacity:{value:opacity},uGlow:{value:glow}},vertexShader:`attribute vec3 color;attribute float aSize;varying vec3 vColor;uniform float uSizeScale;void main(){vColor=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(aSize*uSizeScale*(300.0/max(1.0,-mvPosition.z)),1.0,96.0);gl_Position=projectionMatrix*mvPosition;}`,fragmentShader:`varying vec3 vColor;uniform float uOpacity;uniform float uGlow;void main(){float r=length(gl_PointCoord-vec2(.5))*2.0;float soft=exp(-r*r*5.5);float core=1.0-smoothstep(.12,.48,r);float alpha=max(core,soft*uGlow)*uOpacity;if(alpha<.008)discard;gl_FragColor=vec4(vColor*(1.0+soft*uGlow*2.0),alpha);}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});}

function FireworkLaunchTubes({visible}:{visible:boolean}){return <group visible={visible}>{launchTubes.map(({x,z},i)=><group key={i} position={[x,.34,z]} rotation={[x<0?.035:-.035,0,0]}><mesh castShadow={false}><cylinderGeometry args={[.24,.28,.68,10]}/><meshStandardMaterial color="#473d34" roughness={.82} metalness={.16}/></mesh><mesh position={[0,.346,0]}><torusGeometry args={[.21,.035,6,12]}/><meshStandardMaterial color="#b7834a" metalness={.5} roughness={.45}/></mesh><mesh position={[0,.346,0]}><circleGeometry args={[.18,12]}/><meshBasicMaterial color="#171513" side={THREE.DoubleSide}/></mesh></group>)}</group>}

export default function FireworksShow(){
 const show=useGame(s=>s.fireworksShow),quality=useGame(s=>s.quality),geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(48000),3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(48000),3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aSize',new THREE.BufferAttribute(new Float32Array(16000),1).setUsage(THREE.DynamicDrawUsage));return g;},[]),coreMaterial=useMemo(()=>makeSparkMaterial(1.4,1,.6),[]),glowMaterial=useMemo(()=>makeSparkMaterial(6.8,.28,1.2),[]),points=useRef<THREE.Points>(null),glowPoints=useRef<THREE.Points>(null),plan=useMemo(()=>show?makePlan(show.seed,quality,show.companyPresentationEnabled):[],[show?.seed,show?.companyPresentationEnabled,quality]);
 useEffect(()=>()=>{geometry.dispose();coreMaterial.dispose();glowMaterial.dispose()},[geometry,coreMaterial,glowMaterial]);
 useFrame(()=>{if(!points.current||!show){if(points.current)points.current.visible=false;if(glowPoints.current)glowPoints.current.visible=false;return;}points.current.visible=true;if(glowPoints.current)glowPoints.current.visible=true;const elapsed=(Date.now()-show.startAt)/1000;if(elapsed>=300){useGame.getState().stopFireworks();return;}const pos=geometry.getAttribute('position') as THREE.BufferAttribute,col=geometry.getAttribute('color') as THREE.BufferAttribute,sizes=geometry.getAttribute('aSize') as THREE.BufferAttribute;const p=pos.array as Float32Array,c=col.array as Float32Array,ss=sizes.array as Float32Array;let n=0;const put=(x:number,y:number,z:number,color:THREE.Color,brightness:number,pointSize=.85)=>{if(n>=16000)return;const index=n++,j=index*3;p[j]=x;p[j+1]=y;p[j+2]=z;c[j]=color.r*brightness;c[j+1]=color.g*brightness;c[j+2]=color.b*brightness;ss[index]=pointSize;};
  for(const event of plan){const since=elapsed-event.at;if(since<0||since>event.flight+5.5)continue;if(since<event.flight){const t=since/event.flight,ease=t*t*(3-2*t),x=THREE.MathUtils.lerp(event.origin.x,event.target.x,ease),y=THREE.MathUtils.lerp(event.origin.y,event.target.y,ease),z=THREE.MathUtils.lerp(event.origin.z,event.target.z,ease);const white=new THREE.Color('#fff1bd');for(let k=8;k>=0;k--){const trailT=Math.max(0,t-k*.045),trailEase=trailT*trailT*(3-2*trailT);put(THREE.MathUtils.lerp(event.origin.x,event.target.x,trailEase),THREE.MathUtils.lerp(event.origin.y,event.target.y,trailEase),THREE.MathUtils.lerp(event.origin.z,event.target.z,trailEase),white,.9-k*.065,.34+k*.055);}put(x,y,z,white,2.2,1.8);continue;}
   const age=since-event.flight,flash=Math.max(0,1-age/.13);if(flash>0)put(event.target.x,event.target.y,event.target.z,new THREE.Color('#fff9d8'),flash*6,3.6);
   for(const particle of event.particles){const t=age;if(t>particle.life)continue;const drag=1-Math.exp(-t*.17),gravity=event.style===3?2.05:3.25;let x=event.target.x+particle.direction.x*particle.speed*t*(1-drag*.28),z=event.target.z+particle.direction.z*particle.speed*t*(1-drag*.28),y=event.target.y+particle.direction.y*particle.speed*t-.5*gravity*t*t;if(event.style===5)y+=Math.sin(t*1.8+particle.direction.x*5)*.16*t;const fade=Math.max(0,1-t/particle.life),flicker=.72+.28*Math.sin(t*24+particle.speed);put(x,y,z,particle.color,fade*fade*flicker*particle.size,particle.size*.72);}
  }
  pos.needsUpdate=true;col.needsUpdate=true;sizes.needsUpdate=true;geometry.setDrawRange(0,n);
 });
 return <><points ref={glowPoints} geometry={geometry} material={glowMaterial} frustumCulled={false}/><points ref={points} geometry={geometry} material={coreMaterial} frustumCulled={false}/><FireworkLaunchTubes visible={!!show}/></>;
}

export function CompanyPresentation({position,startAt}:{position:THREE.Vector3;startAt:number}){
 const card=useRef<HTMLDivElement>(null),image=useRef<HTMLImageElement>(null),active=useRef(-1),activeFrame=useRef(-1);
 useEffect(()=>{for(const slide of companySlides){if(slide.key==='logo'){for(const file of companyLogoFrames){const img=new Image();img.src=companyAsset(file);}}else{const img=new Image();img.src=companyAsset(slide.file);}}},[]);
 useFrame(()=>{if(!card.current||!image.current)return;const elapsed=(Date.now()-startAt)/1000,index=companySlides.findIndex(slide=>elapsed>=slide.start&&elapsed<slide.end);if(index!==active.current){active.current=index;activeFrame.current=-1;if(index<0){card.current.style.visibility='hidden';return;}const slide=companySlides[index];image.current.src=companyAsset(slide.key==='logo'?companyLogoFrames[0]:slide.file);image.current.alt=slide.alt;card.current.classList.toggle('is-logo',slide.key==='logo');}if(index<0){card.current.style.visibility='hidden';return;}const slide=companySlides[index],slot=elapsed-slide.start,duration=slide.end-slide.start;if(slide.key==='logo'){const frame=Math.floor(slot/.2)%companyLogoFrames.length;if(frame!==activeFrame.current){activeFrame.current=frame;image.current.src=companyAsset(companyLogoFrames[frame]);}}card.current.style.visibility='visible';card.current.style.opacity=String(Math.max(0,Math.min(1,slot/.8,(duration-slot)/.8)));});
 return <group position={position}><Html center distanceFactor={45} zIndexRange={[10,0]}><div className="company-fireworks-card" ref={card} style={{visibility:'hidden',opacity:0}}><img ref={image} alt=""/><div className="company-fireworks-logo-title" aria-hidden="true"><span>MAC</span><strong>USA ONE</strong></div></div></Html></group>;
}
