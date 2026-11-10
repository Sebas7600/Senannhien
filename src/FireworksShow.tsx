import {Html} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import {useMemo, useRef, useEffect} from 'react';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {playFireworkBurst,playFireworkLaunch,preloadFireworksAudio} from './audio';
import {companySlides,launchTubes,makeFireworksPlan} from './fireworksPlan';
import {sharedEventAge} from './sharedActivity';

const companyAsset=(file:string)=>`/assets/fireworks/company/stills/${file}?v=20261110-user-gif-still-1`;
function makeSparkMaterial(sizeScale:number,opacity:number,glow:number){return new THREE.ShaderMaterial({uniforms:{uSizeScale:{value:sizeScale},uOpacity:{value:opacity},uGlow:{value:glow}},vertexShader:`attribute vec3 color;attribute float aSize;varying vec3 vColor;uniform float uSizeScale;void main(){vColor=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(aSize*uSizeScale*(300.0/max(1.0,-mvPosition.z)),1.0,96.0);gl_Position=projectionMatrix*mvPosition;}`,fragmentShader:`varying vec3 vColor;uniform float uOpacity;uniform float uGlow;void main(){float r=length(gl_PointCoord-vec2(.5))*2.0;float soft=exp(-r*r*5.5);float core=1.0-smoothstep(.12,.48,r);float alpha=max(core,soft*uGlow)*uOpacity;if(alpha<.008)discard;gl_FragColor=vec4(vColor*(1.0+soft*uGlow*2.0),alpha);}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});}

function FireworkLaunchTubes({visible}:{visible:boolean}){return <group visible={visible}>{launchTubes.map(({x,z},i)=><group key={i} position={[x,.34,z]} rotation={[x<0?.035:-.035,0,0]}><mesh castShadow={false}><cylinderGeometry args={[.24,.28,.68,10]}/><meshStandardMaterial color="#473d34" roughness={.82} metalness={.16}/></mesh><mesh position={[0,.346,0]}><torusGeometry args={[.21,.035,6,12]}/><meshStandardMaterial color="#b7834a" metalness={.5} roughness={.45}/></mesh><mesh position={[0,.346,0]}><circleGeometry args={[.18,12]}/><meshBasicMaterial color="#171513" side={THREE.DoubleSide}/></mesh></group>)}</group>}

export default function FireworksShow(){
 const show=useGame(s=>s.fireworksShow),quality=useGame(s=>s.quality),sound=useGame(s=>s.sound),geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(48000),3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(48000),3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aSize',new THREE.BufferAttribute(new Float32Array(16000),1).setUsage(THREE.DynamicDrawUsage));return g;},[]),coreMaterial=useMemo(()=>makeSparkMaterial(1.4,1,.6),[]),glowMaterial=useMemo(()=>makeSparkMaterial(6.8,.28,1.2),[]),points=useRef<THREE.Points>(null),glowPoints=useRef<THREE.Points>(null),plan=useMemo(()=>show?makeFireworksPlan(show.seed,quality,show.companyPresentationEnabled):[],[show?.seed,show?.companyPresentationEnabled,quality]);
 const volleySizes=useMemo(()=>{const counts=new Map<number,number>();for(const event of plan)counts.set(event.at,(counts.get(event.at)??0)+1);return counts;},[plan]);
 const soundClock=useRef({startAt:0,lastElapsed:-.02,launches:new Set<number>(),bursts:new Set<number>()});
 useEffect(()=>{if(show&&sound)preloadFireworksAudio();},[show?.startAt,sound]);
 useFrame(()=>{
  if(!show)return;
  const elapsed=sharedEventAge(show.startAt,show.serverAt,useGame.getState().sharedWorld?.serverOffset)/1000,clock=soundClock.current;
  if(clock.startAt!==show.startAt){soundClock.current={startAt:show.startAt,lastElapsed:-.02,launches:new Set(),bursts:new Set()};}
  const activeClock=soundClock.current,windowStart=elapsed-activeClock.lastElapsed<.45?activeClock.lastElapsed:elapsed-.35;
  for(let i=0;i<plan.length;i++){
   const event=plan[i],size=volleySizes.get(event.at)??1;
   if(event.at<=elapsed&&!activeClock.launches.has(i)){if(event.at>windowStart)playFireworkLaunch(event.style,size);activeClock.launches.add(i);}
   const burstAt=event.at+event.flight;
   if(burstAt<=elapsed&&!activeClock.bursts.has(i)){if(burstAt>windowStart)playFireworkBurst(event.style+i,size);activeClock.bursts.add(i);}
  }
  activeClock.lastElapsed=elapsed;
 });
 useEffect(()=>()=>{geometry.dispose();coreMaterial.dispose();glowMaterial.dispose()},[geometry,coreMaterial,glowMaterial]);
 useFrame(()=>{if(!points.current||!show){if(points.current)points.current.visible=false;if(glowPoints.current)glowPoints.current.visible=false;return;}points.current.visible=true;if(glowPoints.current)glowPoints.current.visible=true;const elapsed=sharedEventAge(show.startAt,show.serverAt,useGame.getState().sharedWorld?.serverOffset)/1000;if(elapsed>=300){useGame.setState({fireworksShow:null});return;}const pos=geometry.getAttribute('position') as THREE.BufferAttribute,col=geometry.getAttribute('color') as THREE.BufferAttribute,sizes=geometry.getAttribute('aSize') as THREE.BufferAttribute;const p=pos.array as Float32Array,c=col.array as Float32Array,ss=sizes.array as Float32Array;let n=0;const put=(x:number,y:number,z:number,color:THREE.Color,brightness:number,pointSize=.85)=>{if(n>=16000)return;const index=n++,j=index*3;p[j]=x;p[j+1]=y;p[j+2]=z;c[j]=color.r*brightness;c[j+1]=color.g*brightness;c[j+2]=color.b*brightness;ss[index]=pointSize;};
  for(const event of plan){const since=elapsed-event.at;if(since<0||since>event.flight+5.5)continue;if(since<event.flight){const t=since/event.flight,ease=t*t*(3-2*t),x=THREE.MathUtils.lerp(event.origin.x,event.target.x,ease),y=THREE.MathUtils.lerp(event.origin.y,event.target.y,ease),z=THREE.MathUtils.lerp(event.origin.z,event.target.z,ease);const white=new THREE.Color('#fff1bd');for(let k=8;k>=0;k--){const trailT=Math.max(0,t-k*.045),trailEase=trailT*trailT*(3-2*trailT);put(THREE.MathUtils.lerp(event.origin.x,event.target.x,trailEase),THREE.MathUtils.lerp(event.origin.y,event.target.y,trailEase),THREE.MathUtils.lerp(event.origin.z,event.target.z,trailEase),white,.9-k*.065,.34+k*.055);}put(x,y,z,white,2.2,1.8);continue;}
   const age=since-event.flight,flash=Math.max(0,1-age/.13);if(flash>0)put(event.target.x,event.target.y,event.target.z,new THREE.Color('#fff9d8'),flash*6,3.6);
   for(const particle of event.particles){const t=age;if(t>particle.life)continue;const drag=1-Math.exp(-t*.17),gravity=event.style===3?2.05:3.25;let x=event.target.x+particle.direction.x*particle.speed*t*(1-drag*.28),z=event.target.z+particle.direction.z*particle.speed*t*(1-drag*.28),y=event.target.y+particle.direction.y*particle.speed*t-.5*gravity*t*t;if(event.style===5)y+=Math.sin(t*1.8+particle.direction.x*5)*.16*t;const fade=Math.max(0,1-t/particle.life),flicker=.72+.28*Math.sin(t*24+particle.speed);put(x,y,z,particle.color,fade*fade*flicker*particle.size,particle.size*.72);}
  }
  pos.needsUpdate=true;col.needsUpdate=true;sizes.needsUpdate=true;geometry.setDrawRange(0,n);
 });
 return <><points ref={glowPoints} geometry={geometry} material={glowMaterial} frustumCulled={false}/><points ref={points} geometry={geometry} material={coreMaterial} frustumCulled={false}/><FireworkLaunchTubes visible={!!show}/></>;
}

export function CompanyPresentation({position,startAt,serverAt}:{position:THREE.Vector3;startAt:number;serverAt?:number}){
 const card=useRef<HTMLDivElement>(null),image=useRef<HTMLImageElement>(null),active=useRef(-1);
 useEffect(()=>{for(const slide of companySlides){const img=new Image();img.src=companyAsset(slide.file);}},[]);
 useFrame(()=>{if(!card.current||!image.current)return;const elapsed=sharedEventAge(startAt,serverAt,useGame.getState().sharedWorld?.serverOffset)/1000,index=companySlides.findIndex(slide=>elapsed>=slide.start&&elapsed<slide.end);if(index!==active.current){active.current=index;if(index<0){card.current.style.visibility='hidden';return;}const slide=companySlides[index];image.current.src=companyAsset(slide.file);image.current.alt=slide.alt;}if(index<0){card.current.style.visibility='hidden';return;}const slide=companySlides[index],slot=elapsed-slide.start,duration=slide.end-slide.start;card.current.style.visibility='visible';card.current.style.opacity=String(Math.max(0,Math.min(1,slot/.45,(duration-slot)/.45)));});
 return <group position={position}><Html center distanceFactor={45} zIndexRange={[10,0]}><div className="company-fireworks-card" ref={card} style={{visibility:'hidden',opacity:0}}><img ref={image} alt=""/></div></Html></group>;
}
