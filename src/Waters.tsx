import {useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RigidBody,CuboidCollider,CylinderCollider} from '@react-three/rapier';
import * as T from 'three';
import {ConvexGeometry} from 'three/examples/jsm/geometries/ConvexGeometry.js';
import {POND,ISLAND,POND_BRIDGES,bridgeHeight,bridgeRailEnd,bridgeSegments,islandContains,pondBoundary,POND_OUTLINE} from './pondLayout';
import {batchGeometry,coloredGeometry} from './geometryBatch';
import {useGame} from './gameStore';
import {useReducedMotion} from './useReducedMotion';
import {WorldLabel} from './Environment';
import {FlyingLanterns,FloatingLotuses,WishStation} from './Lanterns';
import {FISH_FEED_LIFETIME,koiTarget} from './fishFeeding';
import {fullMoonOffset} from './CourtyardSky';

const waterVertex=`
  #include <fog_pars_vertex>
  varying vec3 vPoint;
  void main(){
    vec4 world=modelMatrix*vec4(position,1.0);
    vPoint=world.xyz;
    vec4 mvPosition=viewMatrix*world;
    gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
  }
`;
const waterFragment=`
  #include <fog_pars_fragment>
  varying vec3 vPoint;
  uniform float uTime;
  uniform float uNight;
  uniform vec3 uMoonDirection;
  void main(){
    vec2 p=vPoint.xz;
    float a=sin(dot(p,vec2(1.6,1.1))+uTime*.85);
    float b=cos(dot(p,vec2(-.85,2.2))-uTime*.66);
    vec3 normal=normalize(vec3(a*.042,1.0,b*.043));
    vec3 eye=normalize(cameraPosition-vPoint);
    float glancing=pow(1.0-max(0.0,dot(normal,eye)),3.0);
    vec3 deep=vec3(.019,.166,.126);
    vec3 sky=vec3(.27,.52,.56);
    vec3 color=mix(deep,sky,glancing*.62);
    float flecks=pow(max(0.0,a*b),7.0);
    color+=vec3(.13,.20,.13)*flecks*(.42+glancing*.45);
    color=mix(color,color*vec3(.30,.43,.56),uNight);
    vec3 halfVector=normalize(uMoonDirection+eye);
    float glint=pow(max(0.,dot(normal,halfVector)),94.);
    color+=vec3(.35,.48,.68)*glint*.43*uNight;
    gl_FragColor=vec4(color,.75+.22*glancing);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;
// Keep the same sampled contour as the opening in the terrain.
const waterGeometry=new T.ShapeGeometry(new T.Shape(POND_OUTLINE.map(([x,z])=>new T.Vector2(x*POND.rx,-z*POND.rz)))).rotateX(-Math.PI/2);

function LakeWater(){
  const reduced=useReducedMotion();
  const uniforms=useMemo(()=>T.UniformsUtils.merge([T.UniformsLib.fog,{uTime:{value:0},uNight:{value:0},uMoonDirection:{value:fullMoonOffset.clone().normalize()}}]),[]);
  useFrame(({clock})=>{
    uniforms.uTime.value=reduced?0:clock.elapsedTime;
    uniforms.uNight.value=useGame.getState().night?1:0;
  });
  return <>
    <mesh geometry={waterGeometry} position={[POND.x,POND.bottomY+.025,POND.z]}>
      <meshStandardMaterial color="#52766c" roughness={1}/>
    </mesh>
    <mesh geometry={waterGeometry} position={[POND.x,POND.waterY,POND.z]} renderOrder={-2}>
      <shaderMaterial uniforms={uniforms} vertexShader={waterVertex} fragmentShader={waterFragment} fog transparent depthWrite={false}/>
    </mesh>
  </>;
}

function bankGeometry(){
  const vertices:number[]=[],indices:number[]=[];
  for(let i=0;i<=POND_OUTLINE.length;i++){
    const point=POND_OUTLINE[i%POND_OUTLINE.length];
    const x=POND.x+point[0]*POND.rx,z=POND.z+point[1]*POND.rz;
    vertices.push(x,POND.bankY-.01,z,x,POND.bottomY,z);
    if(i){const j=i*2;indices.push(j-2,j-1,j,j,j-1,j+1);}
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}
const bank=bankGeometry();
const stoneOutline=[[-.53,.91],[-.95,.35],[-.87,-.51],[-.33,-.86],[.50,-.79],[.92,-.35],[.97,.39],[.38,.84]];
const stoneGeometry=new ConvexGeometry([[-.78,.83],[-.04,1],[.62,.72]].flatMap(([y,r],ring)=>
  stoneOutline.map(([x,z],i)=>new T.Vector3(x*r+(ring===2?.09:0),y+Math.sin(i*4+ring)*.12,z*r))));
const stonePoints=stoneGeometry.attributes.position,stoneColors=[];
for(let i=0;i<stonePoints.count;i++){
  const x=stonePoints.getX(i),y=stonePoints.getY(i),z=stonePoints.getZ(i);
  const moss=T.MathUtils.smoothstep(Math.sin(x*6-z*4)*.31+y,.25,.87);
  stoneColors.push(.93-moss*.22,.92-moss*.15,.86-moss*.36);
}
stoneGeometry.setAttribute('color',new T.Float32BufferAttribute(stoneColors,3));
stoneGeometry.computeVertexNormals();
const rim=Array.from({length:115},(_,i)=>i/115*Math.PI*2).filter(angle=>{
  const [x,z]=pondBoundary(angle);
  return !POND_BRIDGES.some(bridge=>x>=bridge.start&&x<=bridge.end&&Math.abs(z-bridge.z)<bridge.halfWidth+.66);
});
function RockShore(){
  const ref=useRef<T.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const mesh=ref.current!,rock=new T.Object3D(),tints=['#918777','#9b8f7a','#77796e','#a59882'].map(c=>new T.Color(c));
    rim.forEach((angle,i)=>{
      const offset=.12*Math.sin(i*5.1);
      const [x,z]=pondBoundary(angle,offset);rock.position.set(x,.035+Math.sin(i*7)*.07,z);
      const [nextX,nextZ]=pondBoundary(angle+.001),tangentX=nextX-x,tangentZ=nextZ-z;
      rock.rotation.set(Math.sin(i*4)*.20,-Math.atan2(tangentZ,tangentX),Math.cos(i*5)*.25);
      rock.scale.set(.54+(i*7%11)*.043,.30+(i*5%9)*.032,.36+(i*3%7)*.055);
      rock.updateMatrix();
      mesh.setMatrixAt(i,rock.matrix);
      mesh.setColorAt(i,tints[i%tints.length]);
    });
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere();
  },[]);
  return <>
    <mesh geometry={bank}><meshStandardMaterial color="#716b58" side={T.DoubleSide} roughness={1}/></mesh>
    <instancedMesh ref={ref} args={[stoneGeometry,undefined,rim.length]} castShadow receiveShadow>
      <meshStandardMaterial roughness={.94} vertexColors flatShading/>
    </instancedMesh>
  </>;
}

const grassClumps:T.BufferGeometry[]=[];
const grassBlade=new T.ConeGeometry(1,1,3);
for(let i=0;i<rim.length;i+=3){
  const angle=rim[i];
  const [x,z]=pondBoundary(angle,.52);
  for(let j=0;j<5;j++){
    const a=j*2.4+i,h=.13+(j*7+i)%6*.027;
    grassClumps.push(coloredGeometry(grassBlade,['#607a44','#789052','#88934e'][j%3],
      [x+Math.sin(a)*.13,POND.bankY+h*.38,z+Math.cos(a)*.13],[.027,h,.016],[Math.sin(a)*.45,a,Math.cos(a)*.42]));
  }
}
const shoreGrass=batchGeometry(grassClumps);
grassBlade.dispose();

const bridgeSpans=POND_BRIDGES.flatMap(bridgeSegments);
const bridgeBox=new T.BoxGeometry(1,1,1);
const railSpans=bridgeSpans.flatMap(span=>{
  const start=span.x-Math.cos(span.angle)*span.length/2,end=Math.min(span.x+Math.cos(span.angle)*span.length/2,bridgeRailEnd(span));
  if(end<=start)return [];
  const y0=bridgeHeight(start,span),y1=bridgeHeight(end,span);
  return [{...span,x:(start+end)/2,y:(y0+y1)/2,angle:Math.atan2(y1-y0,end-start),length:Math.hypot(end-start,y1-y0)}];
});
const bridgeParts:T.BufferGeometry[]=[];
for(const bridge of POND_BRIDGES){
  const count=Math.ceil((bridge.end-bridge.start)/.37),step=(bridge.end-bridge.start)/count;
  for(let i=0;i<count;i++){
    const x=bridge.start+step*(i+.5);
    const dy=bridgeHeight(x+step/2,bridge)-bridgeHeight(x-step/2,bridge);
    const angle=Math.atan2(dy,step);
    bridgeParts.push(coloredGeometry(bridgeBox,['#896149','#927058','#785440','#9c775a'][i%4],
      [x,bridgeHeight(x,bridge)-.051,bridge.z],[Math.hypot(step,dy)-.009,.10,bridge.halfWidth*2],[0,0,angle]));
  }
  for(const side of [-1,1]){
    const z=bridge.z+side*bridge.halfWidth;
    const railEnd=bridgeRailEnd(bridge),posts=Math.ceil((railEnd-bridge.start)/1.95);
    for(let i=0;i<=posts;i++){
      const x=T.MathUtils.lerp(bridge.start+.12,railEnd-.12,i/posts),y=bridgeHeight(x,bridge);
      bridgeParts.push(coloredGeometry(bridgeBox,'#694633',[x,y+.34,z],[.145,.79,.15]));
      bridgeParts.push(coloredGeometry(bridgeBox,'#a38266',[x,y+.75,z],[.19,.062,.19]));
    }
    for(let i=0;i<posts;i++){
      const left=T.MathUtils.lerp(bridge.start+.12,railEnd-.12,i/posts),right=T.MathUtils.lerp(bridge.start+.12,railEnd-.12,(i+1)/posts);
      for(const flip of [false,true]){const y1=bridgeHeight(left,bridge)+(flip?.64:.15),y2=bridgeHeight(right,bridge)+(flip?.15:.64),dx=right-left,dy=y2-y1;bridgeParts.push(coloredGeometry(bridgeBox,'#825d43',[(left+right)/2,(y1+y2)/2,z],[Math.hypot(dx,dy),.065,.075],[0,0,Math.atan2(dy,dx)]));}
    }
    if(bridge.archRise)for(const t of [.12,.37,.63,.88]){const x=T.MathUtils.lerp(bridge.start,bridge.end,t),top=bridgeHeight(x,bridge)-.1,bottom=POND.bottomY-.18;bridgeParts.push(coloredGeometry(bridgeBox,'#654735',[x,(top+bottom)/2,z],[.20,top-bottom,.20]));}
    for(const span of railSpans.filter(span=>span.z===bridge.z)){
      for(const height of [.33,.70]){
        bridgeParts.push(coloredGeometry(bridgeBox,'#72503b',[span.x,span.y+height,z],
          [span.length+.04,.095,.115],[0,0,span.angle]));
      }
    }
  }
}
const bridgeGeometry=batchGeometry(bridgeParts);
const railRadius=ISLAND.radius-.29,railOpening=.45,railBays=14;
const islandRailPosts=Array.from({length:railBays+1},(_,i)=>{
  // Start and end at the west-facing bridge entrance.
  const angle=-Math.PI+railOpening+i*(2*Math.PI-2*railOpening)/railBays;
  return {x:ISLAND.x+Math.cos(angle)*railRadius,z:ISLAND.z+Math.sin(angle)*railRadius};
});
const islandRailSpans=islandRailPosts.slice(1).map((post,i)=>{
  const previous=islandRailPosts[i],dx=post.x-previous.x,dz=post.z-previous.z;
  return {x:(post.x+previous.x)/2,z:(post.z+previous.z)/2,length:Math.hypot(dx,dz),yaw:-Math.atan2(dz,dx)};
});
const islandRailGeometry=batchGeometry([
  ...islandRailPosts.flatMap(({x,z})=>[
    coloredGeometry(bridgeBox,'#78513a',[x,ISLAND.top+.42,z],[.16,.84,.16]),
    coloredGeometry(bridgeBox,'#ab8768',[x,ISLAND.top+.84,z],[.22,.07,.22]),
  ]),
  ...islandRailSpans.flatMap(({x,z,length,yaw})=>[.27,.66].map(height=>
    coloredGeometry(bridgeBox,'#80593e',[x,ISLAND.top+height,z],[length,.10,.12],[0,yaw,0]))),
]);
bridgeBox.dispose();
const islandDepth=ISLAND.top-POND.bottomY;
const islandCenter=ISLAND.top-islandDepth/2;
function LakeCrossings(){
  return <>
    <mesh geometry={bridgeGeometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.82}/></mesh>
    <mesh geometry={islandRailGeometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.82}/></mesh>
    <mesh position={[ISLAND.x,islandCenter-.095,ISLAND.z]} castShadow receiveShadow>
      <cylinderGeometry args={[ISLAND.radius,ISLAND.radius+.10,islandDepth-.19,40]}/>
      <meshStandardMaterial color="#a79e89" roughness={.93}/>
    </mesh>
    <mesh position={[ISLAND.x,ISLAND.top-.095,ISLAND.z]} receiveShadow>
      <cylinderGeometry args={[ISLAND.radius+.08,ISLAND.radius+.08,.19,40]}/>
      <meshStandardMaterial color="#c5baa4" roughness={.87}/>
    </mesh>
    <RigidBody type="fixed" colliders={false}>
      <CylinderCollider args={[islandDepth/2,ISLAND.radius]} position={[ISLAND.x,islandCenter,ISLAND.z]}/>
      {islandRailSpans.map(({x,z,length,yaw},i)=>
        <CuboidCollider key={`island-rail-${i}`} args={[length/2,.38,.07]} position={[x,ISLAND.top+.38,z]} rotation={[0,yaw,0]}/>)}
      {bridgeSpans.map(span=><group key={span.x+'-'+span.z}>
        <CuboidCollider args={[span.length/2,.05,span.halfWidth]} position={[span.x,span.y-.05,span.z]} rotation={[0,0,span.angle]}/>
      </group>)}
      {railSpans.flatMap(span=>[-1,1].map(side=><CuboidCollider key={span.x+'-'+span.z+'-'+side} args={[span.length/2,.38,.06]}
        position={[span.x,span.y+.37,span.z+side*span.halfWidth]} rotation={[0,0,span.angle]}/>))}
    </RigidBody>
  </>;
}

const koiGeometry=batchGeometry([
  coloredGeometry(new T.SphereGeometry(1,10,6),'#f0d8a8',[0,0,0],[.15,.078,.37]),
  coloredGeometry(new T.SphereGeometry(1,8,5),'#cb6d3b',[0,.036,.10],[.118,.052,.146]),
]);
const tailGeometry=new T.ConeGeometry(.145,.23,4).rotateX(-Math.PI/2);
const koiCount=15;
function KoiSchool(){
  const bodies=useRef<T.InstancedMesh>(null),tails=useRef<T.InstancedMesh>(null);
  const work=useRef(new T.Object3D());
  const target=useRef<[number,number]>([0,0]);
  const swimming=useRef(new Float32Array(koiCount*3).fill(Number.NaN));
  const normalTarget=useRef<[number,number]>([0,0]);
  const feedingState=useRef(Array.from({length:koiCount},()=>({x:0,z:0,at:0,blend:0,speed:.65})));
  const reduced=useReducedMotion(),quality=useGame(s=>s.quality);
  useLayoutEffect(()=>{
    for(const mesh of [bodies.current!,tails.current!]){
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.boundingSphere=new T.Sphere(new T.Vector3(POND.x,POND.waterY,POND.z),POND.rz);
    }
  },[]);
  useFrame(({clock},dt)=>{
    dt=Math.min(dt,.05);
    const body=bodies.current!,tail=tails.current!,object=work.current,poses=swimming.current;
    const now=Date.now(),feeds=useGame.getState().fishFeeds;
    const firstActive=feeds.findIndex(item=>now-item.at<FISH_FEED_LIFETIME);
    const count=quality==='low'?9:koiCount,time=reduced?0:clock.elapsedTime;
    body.count=tail.count=count;
    for(let i=0;i<count;i++){
      const feed=firstActive<0?null:feeds[firstActive+i%(feeds.length-firstActive)];
      const a=feedingState.current[i];if(feed){a.x=feed.x;a.z=feed.z;a.at=feed.at;}
      a.blend=T.MathUtils.damp(a.blend,feed?1:0,feed?1.2:.22,dt);a.speed=T.MathUtils.damp(a.speed,feed?1.05:.65,feed?1.5:.3,dt);
      const normal=koiTarget(i,time,null,normalTarget.current),eating=koiTarget(i,time,a,target.current);
      const tx=T.MathUtils.lerp(normal[0],eating[0],a.blend),tz=T.MathUtils.lerp(normal[1],eating[1],a.blend);
      const index=i*3,x0=poses[index]||tx,z0=poses[index+1]||tz;
      const dx=tx-x0,dz=tz-z0,distance=Math.hypot(dx,dz),step=Math.min(distance,a.speed*dt);
      let x=x0+(distance>0?dx/distance*step:0),z=z0+(distance>0?dz/distance*step:0);
      if(islandContains(x,z,-.55)){
        const dx=x-ISLAND.x,dz=z-ISLAND.z,factor=(ISLAND.radius+.55)/(Math.hypot(dx,dz)||1);
        x=ISLAND.x+dx*factor;z=ISLAND.z+dz*factor;
      }
      const oldYaw=poses[index+2]||i,targetYaw=Math.hypot(x-x0,z-z0)>.001?Math.atan2(x-x0,z-z0):oldYaw;
      const yaw=oldYaw+(T.MathUtils.euclideanModulo(targetYaw-oldYaw+Math.PI,Math.PI*2)-Math.PI)*Math.min(1,dt*3);
      poses[index]=x;poses[index+1]=z;poses[index+2]=yaw;
      const y=POND.waterY-.041+Math.sin(time*.20+i*2.399)*.019;
      object.position.set(x,y,z);object.rotation.set(0,yaw,0);object.scale.setScalar(1+(i%4)*.10);object.updateMatrix();
      body.setMatrixAt(i,object.matrix);
      object.position.set(x-Math.sin(yaw)*.40,y,z-Math.cos(yaw)*.40);
      object.rotation.y=yaw+Math.sin(time*(4+a.speed*2)+i)*.3;object.updateMatrix();tail.setMatrixAt(i,object.matrix);
    }
    body.instanceMatrix.needsUpdate=tail.instanceMatrix.needsUpdate=true;
  });
  return <>
    <instancedMesh ref={bodies} args={[koiGeometry,undefined,koiCount]}><meshStandardMaterial vertexColors roughness={.53}/></instancedMesh>
    <instancedMesh ref={tails} args={[tailGeometry,undefined,koiCount]}><meshStandardMaterial color="#cc9864" roughness={.68}/></instancedMesh>
  </>;
}

const pads:T.BufferGeometry[]=[],blossoms:T.BufferGeometry[]=[];
for(let i=0;i<37;i++){
  const angle=i*2.39996,radius=.56+i%7*.053;
  const x=POND.x+Math.cos(angle)*POND.rx*radius,z=POND.z+Math.sin(angle)*POND.rz*radius;
  if(islandContains(x,z,-1)||POND_BRIDGES.some(bridge=>x>bridge.start&&x<bridge.end&&Math.abs(z-bridge.z)<bridge.halfWidth+1))continue;
  const y=POND.waterY+.025;
  pads.push(coloredGeometry(new T.CircleGeometry(.47+i%4*.045,11,0,5.52).rotateZ(i),
    ['#688c54','#7f9a5b','#799352'][i%3],[x,y,z],[1,1,1],[-Math.PI/2,0,0]));
  if(i%4===1)continue;
  for(let ring=0;ring<2;ring++){
    const count=ring===0?7:5;
    for(let j=0;j<count;j++){
      const a=(j+ring*.5)/count*Math.PI*2,r=ring===0?.19:.105;
      blossoms.push(coloredGeometry(new T.SphereGeometry(1,6,4),
        ring===0?(i%3===0?'#ce938f':'#e0ada3'):'#f3d7c2',
        [x+Math.cos(a)*r,y+.145+ring*.045,z+Math.sin(a)*r],
        [.075,.175-ring*.04,.08],[Math.sin(a)*.70,0,-Math.cos(a)*.70]));
    }
  }
  blossoms.push(coloredGeometry(new T.SphereGeometry(.078,7,4),'#d3ac59',[x,y+.24,z]));
}
const lotusPads=batchGeometry(pads),lotusFlowers=batchGeometry(blossoms);

export default function Waters(){
  return <>
    <LakeWater/><RockShore/><LakeCrossings/><KoiSchool/>
    <mesh geometry={shoreGrass} receiveShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>
    <mesh geometry={lotusPads} receiveShadow><meshStandardMaterial vertexColors roughness={.88}/></mesh>
    <mesh geometry={lotusFlowers}><meshStandardMaterial vertexColors roughness={.68}/></mesh>
    <FlyingLanterns/><FloatingLotuses/><WishStation/>
    <WorldLabel position={[POND_BRIDGES[0].start,1.8,POND_BRIDGES[0].z-2.5]} title="HỒ CÁ KOI" subtitle="E · Cho cá ăn"/>
  </>;
}
