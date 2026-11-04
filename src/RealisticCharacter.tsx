import {memo,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {clothGeometry,torsoCloth,skirtCloth,sleeveCloth} from './clothGeometry';
import {useSurface} from './materials';
import {sampleBow,type BowMode} from './bowTimeline';
import {CUSHION} from './cushionData';
import type {DishId} from './gameData';
import {useReducedMotion} from './useReducedMotion';
import {Food} from './Food';
export interface CharacterProps{robe?:string;dish?:DishId;pose?:string;moving?:boolean;chair?:boolean;seated?:boolean;gender?:'male'|'female';skin?:string;robeStyle?:'traditional'|'cross';bowStartedAt?:number;bowMode?:BowMode;bowElapsed?:number}
const yAxis=new THREE.Vector3(0,1,0);
const skinCache=new Map<string,THREE.MeshStandardMaterial>();
function skinMaterial(color:string,vertexColors=false){const key=color+vertexColors;let m=skinCache.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.57,metalness:0,vertexColors});skinCache.set(key,m)}return m;}
function Head({gender,skin,calm}:{gender:'male'|'female';skin:string;calm:boolean}){const {scene}=useGLTF('/assets/models/human-head.glb');const geometry=useMemo(()=>{let found:THREE.BufferGeometry|null=null;scene.traverse(o=>{if(o instanceof THREE.Mesh)found=o.geometry});return found!},[scene]);const skinMat=skinMaterial(skin,true);return <group scale={[gender==='female'?.95:1,1,gender==='female'?.97:1]}><mesh geometry={geometry} material={skinMat} castShadow receiveShadow/>{[-1,1].map(s=><group key={s} position={[s*.0415,.1598,.1478]}><mesh scale={[1,calm?.10:1,1]}><sphereGeometry args={[.0208,16,12]}/><meshStandardMaterial color="#dbd4c7" roughness={.28}/></mesh>{!calm&&<><mesh position={[0,0,.020]}><sphereGeometry args={[.0075,12,8]}/><meshStandardMaterial color="#5d4735" roughness={.4}/></mesh><mesh position={[0,0,.025]}><sphereGeometry args={[.0035,10,6]}/><meshStandardMaterial color="#242820"/></mesh><mesh position={[.0015,.0025,.027]}><sphereGeometry args={[.0013,6,4]}/><meshBasicMaterial color="#f5f1df"/></mesh></>}</group>)}{[-1,1].map(s=><mesh key={s} position={[s*.043,.191,.143]} rotation={[0,0,Math.PI/2+s*.08]}><capsuleGeometry args={[.0025,.032,3,8]}/><meshStandardMaterial color="#574a3a" roughness={.9}/></mesh>)}</group>}
function Hand({material}:{material:THREE.Material}){return <group><mesh material={material} scale={[.026,.047,.012]} castShadow><sphereGeometry args={[1,14,10]}/></mesh>{[-1.5,-.5,.5,1.5].map((x,i)=><mesh key={i} position={[x*.011,.057-(i===3?.009:0),0]} material={material}><capsuleGeometry args={[.005,.045,3,8]}/></mesh>)}<mesh material={material} position={[-.031,.005,.002]} rotation={[0,0,-.55]}><capsuleGeometry args={[.007,.035,3,8]}/></mesh></group>}
function setSegment(group:THREE.Group|null,a:THREE.Vector3,b:THREE.Vector3,radius:number,work:THREE.Vector3){if(!group)return;group.position.copy(a);work.copy(b).sub(a);group.scale.set(radius,work.length(),radius);group.quaternion.setFromUnitVectors(yAxis,work.normalize());}
function RealisticCharacter({robe='#9b704a',dish='noodles',pose='walk',moving=false,chair=false,seated=false,gender='male',skin='#c99c79',robeStyle='traditional',bowStartedAt,bowMode,bowElapsed}:CharacterProps){
  const reduced=useReducedMotion(),bookLeaf=useRef<THREE.Group>(null);
  const walkLegs=useRef<THREE.Group>(null),kneelLegs=useRef<THREE.Group>(null),thighL=useRef<THREE.Mesh>(null),thighR=useRef<THREE.Mesh>(null),shinL=useRef<THREE.Mesh>(null),shinR=useRef<THREE.Mesh>(null),kneeL=useRef<THREE.Mesh>(null),kneeR=useRef<THREE.Mesh>(null),footL=useRef<THREE.Mesh>(null),footR=useRef<THREE.Mesh>(null),bowFrame=useRef({kneel:0,bend:0,reach:0,done:false});
  const waterDrops=useRef<THREE.Group>(null);const root=useRef<THREE.Group>(null),upper=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null),armL=useRef<THREE.Group>(null),armR=useRef<THREE.Group>(null),foreL=useRef<THREE.Group>(null),foreR=useRef<THREE.Group>(null),handL=useRef<THREE.Group>(null),handR=useRef<THREE.Group>(null),legL=useRef<THREE.Group>(null),legR=useRef<THREE.Group>(null),coat=useRef<THREE.Mesh>(null);
  const robeMaterial=useSurface('cloth',robe),trimMaterial=useSurface('cloth',new THREE.Color(robe).multiplyScalar(.75).getStyle()),skinMat=skinMaterial(skin),blend=useRef({prayer:0,eat:0,bend:0,hips:.84,gait:0,kneel:0,reach:0}),points=useRef(Array.from({length:8},()=>new THREE.Vector3())),work=useRef(new THREE.Vector3()),lastPose=useRef(pose),bowTime=useRef(-1);
  useFrame(({clock},dt)=>{const t=clock.elapsedTime;if(waterDrops.current)waterDrops.current.children.forEach((drop,i)=>{const f=(t*1.7+i/7)%1;drop.position.set(Math.sin(i*2.4)*.045,-.04-f*.45,.3+f*.21)});const b=blend.current,mode=bowMode||(seated&&!chair?'cushion':'standing');const prayer=['incense','flower','candle','pray','beads','chant','meditate','bow'].includes(pose);if(lastPose.current!==pose||bowTime.current<0){lastPose.current=pose;bowTime.current=t;}
    if(pose==='bow'){sampleBow(bowElapsed??(bowStartedAt===undefined?t-bowTime.current:(Date.now()-bowStartedAt)/1000),mode,bowFrame.current);b.kneel=mode==='standing'?bowFrame.current.kneel:0;b.bend=bowFrame.current.bend;b.reach=bowFrame.current.reach;}else{b.kneel=THREE.MathUtils.damp(b.kneel,0,10,dt);b.bend=THREE.MathUtils.damp(b.bend,['plant','harvest'].includes(pose)?.38:pose==='water'?.14:['incense','flower','candle'].includes(pose)?Math.sin(Math.min((t-bowTime.current)/3,1)*Math.PI)*.18:0,10,dt);b.reach=THREE.MathUtils.damp(b.reach,0,10,dt)}
    b.prayer=THREE.MathUtils.damp(b.prayer,prayer?1:0,9,dt);b.eat=THREE.MathUtils.damp(b.eat,pose==='eat'?1:0,7,dt);const hip=seated?(chair?.10:.22):THREE.MathUtils.lerp(.84,.24,b.kneel);b.hips=pose==='bow'?hip:THREE.MathUtils.damp(b.hips,hip,12,dt);b.gait=THREE.MathUtils.damp(b.gait,moving&&!seated&&pose!=='bow'?1:0,10,dt);
    if(bookLeaf.current)bookLeaf.current.rotation.z=reduced?0:Math.sin(t*.7)*.28;
    if(root.current)root.current.position.y=Math.abs(Math.sin(t*7))*b.gait*.022;
    if(upper.current){upper.current.position.y=b.hips;upper.current.position.z=b.reach*.08;upper.current.rotation.x=b.bend;upper.current.scale.x=gender==='female'?.95:1;}
    if(head.current)head.current.rotation.x=(['meditate','chant','read'].includes(pose)?.16:0)+b.eat*.07+b.reach*.12;
    if(legL.current&&legR.current){legL.current.rotation.x=Math.sin(t*7)*b.gait*.35;legR.current.rotation.x=-Math.sin(t*7)*b.gait*.35;}
    if(coat.current){coat.current.rotation.x=Math.sin(t*7)*b.gait*.018;coat.current.scale.set(1,THREE.MathUtils.lerp(1,.32,b.kneel),THREE.MathUtils.lerp(1,2.05,b.kneel));}
    if(walkLegs.current)walkLegs.current.visible=b.kneel<.001;if(kneelLegs.current)kneelLegs.current.visible=b.kneel>=.001;
    for(let i=0;i<2;i++){const s=i===0?-1:1,shoulder=points.current[0],elbow=points.current[1],wrist=points.current[2],hand=points.current[3];const swing=Math.sin(t*7+i*Math.PI)*b.gait*.13;
      shoulder.set(s*.193,.42,0);elbow.set(s*.225,.16,.015+swing);wrist.set(s*.205,-.12,.03+swing);if(seated){elbow.set(s*.26,.12,.09);wrist.set(s*.17,-.03,.23)}
      elbow.lerp(points.current[4].set(s*.27,.14,.15),b.prayer);wrist.lerp(points.current[5].set(s*.023,.33,.28),b.prayer);
      if(['plant','harvest'].includes(pose)){const cycle=Math.sin((t-bowTime.current)*5);elbow.set(s*.24,.08,.16);wrist.set(s*.16,-.22+cycle*.035,.38+cycle*.06);}
      if(pose==='water'){elbow.set(s*.25,.18,.20);wrist.set(s*.19,.08,.41);}
      if(pose==='feed'){const cycle=(t-bowTime.current)*4;elbow.set(s*.24,.20,.18);wrist.set(i?.25:-.12,i?.18+Math.sin(cycle)*.06:.05,i?.40+Math.cos(cycle)*.14:.24);}
      if(b.eat>0){elbow.lerp(points.current[4].set(s*.25,.27,.13),b.eat);wrist.lerp(points.current[5].set(s*.09,.35+(i?Math.sin(t*2.5)*.12:.01),.29-(i?Math.sin(t*2.5)*.11:0)),b.eat)}
      if(pose==='read'){elbow.set(s*.24,.15,.12);wrist.set(s*.16,.13,.34);}
      if(pose==='tea'&&i===1){const sip=(Math.sin((reduced?0:t)*1.3)+1)/2;elbow.set(.24,.22,.14);wrist.set(.08,.22+sip*.23,.33-sip*.10);}
      if(pose==='serve'){elbow.set(s*.24,.12,.15);wrist.set(s*.17,.08,.42);}
      if(pose==='eat'&&dish==='bread'){const bite=(Math.sin(t*2)+1)/2;wrist.set(s*.09,.25+bite*.17,.32-bite*.1);}
      if(b.reach>0){const ground=seated&&!chair?-CUSHION.seatLift:0,cos=Math.cos(b.bend),sin=Math.sin(b.bend),forward=b.reach*.08;
        const ey=ground+.19-b.hips,ez=.58-forward,wy=ground+.014-b.hips,wz=.78-forward;
        elbow.lerp(points.current[4].set(s*.29,ey*cos+ez*sin,-ey*sin+ez*cos),b.reach);wrist.lerp(points.current[5].set(s*.22,wy*cos+wz*sin,-wy*sin+wz*cos),b.reach);
      }
      setSegment(i?armR.current:armL.current,shoulder,elbow,.10,work.current);setSegment(i?foreR.current:foreL.current,elbow,wrist,.085,work.current);const h=i?handR.current:handL.current;if(h){h.position.copy(wrist);h.rotation.set(THREE.MathUtils.lerp((1-b.prayer)*(seated?-.8:Math.PI),Math.PI/2-b.bend,b.reach),s*b.prayer*Math.PI/2*(1-b.reach),s*.04*(1-b.prayer)*(1-b.reach));}
    }
    if(b.kneel>.001)for(let i=0;i<2;i++){const side=i?-1:1,hip=points.current[0].set(side*.105,b.hips,0),knee=points.current[1].set(side*THREE.MathUtils.lerp(.105,.17,b.kneel),THREE.MathUtils.lerp(.43,.10,b.kneel),THREE.MathUtils.lerp(.02,.27,b.kneel)),ankle=points.current[2].set(side*.14,.065,THREE.MathUtils.lerp(0,-.23,b.kneel));
      const thigh=i?thighL.current:thighR.current,shin=i?shinL.current:shinR.current;
      for(let j=0;j<2;j++){const mesh=j?shin:thigh,a=j?knee:hip,z=j?ankle:knee;if(mesh){mesh.position.copy(a).add(z).multiplyScalar(.5);work.current.copy(z).sub(a);const length=work.current.length();mesh.scale.set(.1,length,.1);mesh.quaternion.setFromUnitVectors(yAxis,work.current.normalize())}}
      (i?kneeL.current:kneeR.current)?.position.copy(knee);const foot=i?footL.current:footR.current;if(foot)foot.position.set(side*.14,.045,THREE.MathUtils.lerp(.07,-.31,b.kneel));
    }
  });
  const pants=useMemo(()=>clothGeometry([[0,.10],[.15,.105],[.35,.11],[.58,.105],[.70,.095]],9,.008,1),[]);
  const calm=['meditate','chant','bow'].includes(pose);
  return <group ref={root}>
    <group ref={upper} position={[0,.84,0]}>
      <mesh geometry={torsoCloth} material={robeMaterial} castShadow receiveShadow/>
      <mesh material={skinMat} position={[0,.55,0]}><cylinderGeometry args={[.065,.078,.16,20]}/></mesh>
      <group ref={head} position={[0,.56,0]}><Head gender={gender} skin={skin} calm={calm}/></group>
      <mesh material={trimMaterial} position={[robeStyle==='cross'?.03:.075,.28,.147]} rotation={[0,0,robeStyle==='cross'?-.5:-.25]}><boxGeometry args={[robeStyle==='cross'?.07:.018,.50,.009]}/></mesh>
      {[armL,armR,foreL,foreR].map((ref,i)=><group key={i} ref={ref}><mesh geometry={sleeveCloth} material={robeMaterial} castShadow receiveShadow/></group>)}
      {[handL,handR].map((ref,i)=><group key={i} ref={ref}><Hand material={skinMat}/>{pose==='eat'&&dish!=='bread'&&dish!=='rice'&&i===1&&<group rotation={[.3,0,.4]}><mesh position={[0,.03,.08]}><cylinderGeometry args={[.006,.006,.32,6]}/><meshStandardMaterial color="#725639"/></mesh><mesh position={[.02,.03,.08]}><cylinderGeometry args={[.006,.006,.32,6]}/><meshStandardMaterial color="#725639"/></mesh></group>}{pose==='eat'&&dish==='rice'&&i===1&&<group><mesh position={[0,.05,.09]}><cylinderGeometry args={[.009,.009,.24,6]}/><meshStandardMaterial color="#abac9a"/></mesh><mesh position={[0,.18,.09]} scale={[.026,.045,.012]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#c9cabc"/></mesh></group>}{pose==='eat'&&dish==='bread'&&i===1&&<group rotation={[.8,0,Math.PI/2]}><mesh><capsuleGeometry args={[.055,.18,5,12]}/><meshStandardMaterial color="#c89550"/></mesh><mesh position={[0,0,.045]}><boxGeometry args={[.035,.2,.02]}/><meshStandardMaterial color="#799456"/></mesh></group>}{pose==='tea'&&i===1&&<group position={[0,.03,.02]} rotation={[.8,0,0]}><mesh><cylinderGeometry args={[.05,.035,.07,12]}/><meshStandardMaterial color="#b5c19a"/></mesh><mesh position={[0,.036,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.04,12]}/><meshStandardMaterial color="#7b8850"/></mesh></group>}</group>)}
      {pose==='read'&&<group position={[0,.12,.37]} rotation={[-.35,0,0]}><mesh rotation={[0,0,.12]} position={[-.095,0,0]}><boxGeometry args={[.19,.025,.25]}/><meshStandardMaterial color="#f4ead0"/></mesh><mesh rotation={[0,0,-.12]} position={[.095,0,0]}><boxGeometry args={[.19,.025,.25]}/><meshStandardMaterial color="#f4ead0"/></mesh><group ref={bookLeaf}><mesh position={[.085,.02,0]}><boxGeometry args={[.17,.006,.24]}/><meshStandardMaterial color="#fff3d7"/></mesh></group><mesh><boxGeometry args={[.015,.025,.25]}/><meshStandardMaterial color="#9a8d68"/></mesh></group>}
      {pose==='serve'&&<group position={[0,.04,.43]}><mesh><boxGeometry args={[.48,.025,.34]}/><meshStandardMaterial color="#9a7d55"/></mesh><group position={[0,.025,0]} scale={.4}><Food dish={dish}/></group></group>}
      {pose==='water'&&<group position={[.2,.08,.46]} rotation={[.35,0,-.12]}><mesh><cylinderGeometry args={[.12,.1,.21,10]}/><meshStandardMaterial color="#778f83" roughness={.8}/></mesh><mesh position={[0,.13,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.11,.015,5,12]}/><meshStandardMaterial color="#667b6e"/></mesh><mesh position={[0,.05,.18]} rotation={[Math.PI/3,0,0]}><cylinderGeometry args={[.035,.025,.28,7]}/><meshStandardMaterial color="#778f83"/></mesh><group ref={waterDrops}>{Array.from({length:7},(_,i)=><mesh key={i} position={[Math.sin(i*2.4)*.045,-.04-i*.055,.3+i*.025]} scale={[.012,.033,.012]}><sphereGeometry args={[1,5,4]}/><meshBasicMaterial color="#a2d8e2"/></mesh>)}</group></group>}
      {pose==='plant'&&<mesh position={[.04,-.05,.34]}><sphereGeometry args={[.07,7,5]}/><meshStandardMaterial color="#b1a283"/></mesh>}
      {pose==='flower'&&<group position={[0,.38,.32]}><mesh><cylinderGeometry args={[.015,.015,.4,6]}/><meshStandardMaterial color="#627d4f"/></mesh>{[-1,0,1].map(i=><mesh key={i} position={[i*.065,.22+Math.abs(i)*.025,0]} scale={[.07,.09,.06]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial color="#e0a4b1"/></mesh>)}</group>}
      {pose==='candle'&&<group position={[0,.34,.32]}><mesh><cylinderGeometry args={[.09,.06,.07,16]}/><meshStandardMaterial color="#b48b45" metalness={.6}/></mesh><mesh position={[0,.09,0]} scale={[.025,.06,.025]}><sphereGeometry args={[1,10,8]}/><meshStandardMaterial emissive="#ffad35" color="#ffe1a1" emissiveIntensity={1.5}/></mesh></group>}
      {pose==='incense'&&<mesh position={[0,.48,.28]}><cylinderGeometry args={[.009,.009,.45,6]}/><meshStandardMaterial color="#936b45"/></mesh>}

      {pose==='beads'&&<mesh position={[0,.29,.33]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.075,.012,6,27]}/><meshStandardMaterial color="#593c25" roughness={.8}/></mesh>}
    </group>
    <group visible={!seated}>
      <mesh ref={coat} geometry={skirtCloth} material={robeMaterial} castShadow receiveShadow/>
      <group ref={walkLegs}>
      {[legL,legR].map((ref,i)=><group key={i} ref={ref} position={[i===0?-.095:.095,.8,0]}><mesh position={[0,-.72,0]} geometry={pants} material={trimMaterial} castShadow/><mesh position={[0,-.74,.06]} scale={[.073,.04,.135]} castShadow><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#4c463a" roughness={.85}/></mesh></group>)}
      </group>
      <group ref={kneelLegs} visible={false}>
        {[thighL,thighR,shinL,shinR].map((ref,i)=><mesh key={i} ref={ref} material={robeMaterial} castShadow><cylinderGeometry args={[1,1,1,10]}/></mesh>)}
        {[kneeL,kneeR].map((ref,i)=><mesh key={i} ref={ref} scale={[.11,.09,.12]} material={robeMaterial} castShadow><sphereGeometry args={[1,10,6]}/></mesh>)}
        {[footL,footR].map((ref,i)=><mesh key={i} ref={ref} scale={[.08,.045,.14]} material={trimMaterial} castShadow><sphereGeometry args={[1,10,6]}/></mesh>)}
      </group>
    </group>
    <group visible={seated&&!chair}>{[-1,1].map(s=><mesh key={s} position={[s*.13,.14,.10]} rotation={[0,s*.65,s*.2]} scale={[.23,.12,.17]} material={robeMaterial} castShadow><sphereGeometry args={[1,24,16]}/></mesh>)}</group>
    <group visible={seated&&chair}>{[-1,1].map(s=><group key={s}><mesh position={[s*.10,.085,.11]} rotation={[Math.PI/2,0,0]} scale={[.095,.22,.09]} material={robeMaterial} castShadow><sphereGeometry args={[1,20,12]}/></mesh><mesh position={[s*.10,-.15,.28]} material={trimMaterial}><cylinderGeometry args={[.075,.06,.38,16]}/></mesh><mesh position={[s*.10,-.38,.33]} scale={[.075,.05,.13]}><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#4c463a" roughness={.85}/></mesh></group>)}</group>
    {pose==='mok'&&<mesh position={[.37,.17,.50]} scale={[.18,.14,.21]}><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color="#8e6039" roughness={.6}/></mesh>}
    {pose==='sweep'&&<group position={[.32,.65,.18]} rotation={[.2,0,-.4]}><mesh><cylinderGeometry args={[.013,.018,1.4,10]}/><meshStandardMaterial color="#7d6543"/></mesh><mesh position={[0,-.66,0]} rotation={[0,0,Math.PI]}><coneGeometry args={[.19,.38,20]}/><meshStandardMaterial color="#b89f6a" roughness={1}/></mesh></group>}
  </group>;
}
export default memo(RealisticCharacter);
