import ChibiLapRobe from './ChibiLapRobe';
import {ChibiBroom, ChibiHandProp, ChibiYoke} from './ChibiProps';
import {createChibiPose} from './chibiPose';
import {Suspense, useEffect, useMemo, useRef} from 'react';
import {createPortal, useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {AnimationMixer, Color, MathUtils, Group, Mesh, Quaternion, SkinnedMesh, Vector3} from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {type CharacterProps} from './RealisticCharacter';
import FemaleChibiHair from './FemaleChibiHair';
import {useReducedMotion} from './useReducedMotion';
import {ReadingBook,TeaCup} from './QuietActivityProps';
import {NPC_CHIBI_SCALE,npcServiceLead} from './npcAppearance';
import {useGame} from './gameStore';
import {canDisplayHandItem,type Equipment} from './equipmentData';
import EquipmentMesh from './EquipmentMesh';
import {createSweepPose,sampleChibiSweepPose,sweepContact,CHIBI_SWEEP} from './sweepMotion';
import {createChibiWaterFrame,sampleChibiWater} from './chibiWaterMotion';
import {WATER_TASK} from './waterTaskData';
import ChibiBucket from './ChibiBucket';
import {DRUM_FACE_CENTER} from './drumMotion';

const modelUrl = '/assets/characters/thay-chua-chibi.glb';

type PlayerAvatarProps = CharacterProps & {actionStartedAt?:number;equipment?:Equipment;npc?:boolean;running?: boolean; stairsDirection?: -1|0|1};

function ChibiAvatar({actionStartedAt,equipment,moving, running, npc, serveFrame, apron, gender = 'male', stairsDirection = 0, localPlayer, dish, pose = 'walk', seated = false, chair = false, bowMode, bowStartedAt, bowElapsed, robe = '#9b704a', skin = '#c99c79'}: PlayerAvatarProps) {
  const {scene, animations} = useGLTF(modelUrl);
  const avatar = useMemo(() => {
    const instance = clone(scene);
    instance.traverse(node => {
      if (node instanceof Mesh) node.castShadow = true;
      if (node instanceof SkinnedMesh) node.frustumCulled = false;
    });
    // Round out the profile without changing the head joint or animation tracks.
    instance.getObjectByName('Dau')?.scale.set(1, .91, 1.13);
    return instance;
  }, [scene]);
  useEffect(() => {
    const cleanup: (() => void)[] = [];
    avatar.traverse(node => {
      if (!(node instanceof SkinnedMesh)) return;
      const geometry = node.geometry.clone();
      const colors = geometry.getAttribute('color');
      const robeColor = new Color(robe);
      const skinColor = new Color(skin);
      // The exported mesh uses vertex colors for fabric and skin in one material.
      for (let i = 0; i < colors.count; i++) {
        const red = colors.getX(i);
        const green = colors.getY(i);
        if (Math.abs(red - .65) < .01) {
          colors.setXYZ(i, skinColor.r, skinColor.g, skinColor.b);
        } else if (Math.abs(red - .16) < .005 && Math.abs(green - .05) < .007) {
          colors.setXYZ(i, robeColor.r, robeColor.g, robeColor.b);
        }
      }
      colors.needsUpdate = true;
      const original = node.geometry;
      node.geometry = geometry;
      cleanup.push(() => { node.geometry = original; geometry.dispose(); });
    });
    return () => cleanup.forEach(dispose => dispose());
  }, [avatar, robe, skin]);
  const mixer = useMemo(() => new AnimationMixer(avatar), [avatar]);
  const rig = useMemo(() => createChibiPose(avatar), [avatar]);
  const service=useRef({handX:0,handY:0,handZ:0,bend:0,hips:0,release:0});
  const reduced=useReducedMotion();
  const clipName = moving && !seated ? (running && !stairsDirection ? 'Run' : 'Walk') : 'Idle';
  useEffect(() => {
    const clip = animations.find(item => item.name === clipName);
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset().fadeIn(.15).play();
    return () => { action.fadeOut(.15); };
  }, [animations, clipName, mixer]);
  useEffect(() => () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(avatar);
  }, [avatar, mixer]);
  const bodyVisual = useRef<Group>(null);
  const heldProp = useRef<Group>(null);
  const equipmentProp=useRef<Group>(null),holding=!!equipment?.hand&&canDisplayHandItem(pose,seated);
  const sweepFrame=useMemo(createSweepPose,[]);
  const waterFrame=useMemo(createChibiWaterFrame,[]),waterClock=useRef({pose:'',at:0});
  const upright = useMemo(() => ({parent:new Quaternion(),avatar:new Quaternion(), mouth:new Vector3(), direction:new Vector3(), axis:new Vector3(0,1,0), rest:new Vector3(), leftHand:new Vector3(), rightHand:new Vector3()}),[]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    if (bodyVisual.current) {
      const visualHeight = seated||pose==='bow' ? 0 : moving && stairsDirection === 1 ? -.085 : -.025;
      bodyVisual.current.position.z = MathUtils.damp(bodyVisual.current.position.z,npc&&pose==='serve'&&serveFrame?npcServiceLead(serveFrame.current)/NPC_CHIBI_SCALE:seated && !chair ? -.06 : 0,16,dt);
      bodyVisual.current.position.y = MathUtils.damp(bodyVisual.current.position.y,visualHeight,16,dt);
    }
    rig.restore();
    mixer.update(dt);
    if(npc&&serveFrame){Object.assign(service.current,serveFrame.current);service.current.handZ-=(bodyVisual.current?.position.z??0)*NPC_CHIBI_SCALE;}
    if(pose==='sweep')sampleChibiSweepPose(Date.now(),reduced,sweepFrame,localPlayer?sweepContact:null,-(bodyVisual.current?.position.y??-.025));
    const bucketPose=pose==='drawWater'||pose==='pourWater';
    if(bucketPose){const now=Date.now();if(waterClock.current.pose!==pose)waterClock.current={pose,at:now};const at=localPlayer?useGame.getState().waterQuest?.phaseAt??waterClock.current.at:actionStartedAt??waterClock.current.at;sampleChibiWater(pose,(now-at)/(pose==='drawWater'?WATER_TASK.drawMs:WATER_TASK.pourMs),waterFrame);}else waterClock.current.pose='';
    rig.update(pose,seated,chair,dt,bowMode,bowElapsed ?? (bowStartedAt === undefined ? undefined : (Date.now()-bowStartedAt)/1000),stairsDirection,!!moving,reduced,npc&&serveFrame?service.current:undefined,holding,pose==='sweep'?sweepFrame:undefined,bucketPose?waterFrame:undefined,actionStartedAt===undefined?undefined:Math.max(0,(Date.now()-actionStartedAt)/1000));
    if(holding&&equipmentProp.current?.parent){
      const prop=equipmentProp.current;
      avatar.getObjectByName('Co_Tay_L')!.getWorldPosition(upright.leftHand);avatar.getObjectByName('Co_Tay_R')!.getWorldPosition(upright.rightHand);
      prop.position.copy(prop.parent!.worldToLocal(upright.leftHand.lerp(upright.rightHand,.5)));
      avatar.getWorldQuaternion(upright.avatar);prop.parent!.getWorldQuaternion(upright.parent);prop.quaternion.copy(upright.parent.invert().multiply(upright.avatar));
    }
    const prop = heldProp.current;
    if (prop) prop.position.set(0,0,0);
    if(pose==='drum'&&prop?.parent){
      avatar.getObjectByName('Co_Tay_R')!.getWorldPosition(upright.leftHand);
      upright.direction.set(DRUM_FACE_CENTER[0]-upright.leftHand.x,DRUM_FACE_CENTER[1]-upright.leftHand.y,DRUM_FACE_CENTER[2]-upright.leftHand.z).normalize();
      prop.parent.getWorldQuaternion(upright.parent);upright.direction.applyQuaternion(upright.parent.invert());
      prop.position.set(0,0,0);prop.quaternion.setFromUnitVectors(upright.axis,upright.direction);prop.scale.setScalar(1.35);
    } else if ((pose === 'tea' || pose === 'read') && prop?.parent) {
      if(pose==='tea'){
        avatar.getObjectByName('Co_Tay_L')!.getWorldPosition(upright.leftHand);
        avatar.getObjectByName('Co_Tay_R')!.getWorldPosition(upright.rightHand);
        avatar.worldToLocal(upright.rest.copy(upright.leftHand).lerp(upright.rightHand,.5));
        upright.rest.y+=.014;upright.rest.z+=.055;
        avatar.localToWorld(upright.rest);prop.position.copy(prop.parent.worldToLocal(upright.rest));
      }
      if(pose==='read'){
        avatar.localToWorld(upright.rest.set(0,.30+rig.quiet.breath,.34));
        prop.position.copy(prop.parent.worldToLocal(upright.rest));
      }
      avatar.getWorldQuaternion(upright.avatar);
      prop.parent.getWorldQuaternion(upright.parent);
      prop.quaternion.copy(upright.parent.invert().multiply(upright.avatar));
      upright.parent.setFromAxisAngle(upright.direction.set(1,0,0),pose==='tea'?-rig.quiet.cupTilt:-.32);
      prop.quaternion.multiply(upright.parent);prop.scale.setScalar(pose==='tea'?1.2:1);
    } else if ((pose === 'incense' || pose === 'water' || pose === 'drawWater' || pose === 'flower' || pose === 'candle') && prop?.parent) {
      if (pose === 'flower' || pose === 'candle') {
        avatar.getObjectByName('Co_Tay_L')!.getWorldPosition(upright.leftHand);
        prop.parent.getWorldPosition(upright.rightHand);
        prop.position.copy(prop.parent.worldToLocal(upright.leftHand.lerp(upright.rightHand,.5)));
      }
      prop.scale.setScalar(1);
      avatar.getWorldQuaternion(upright.avatar);
      prop.parent.getWorldQuaternion(upright.parent);
      prop.quaternion.copy(upright.parent.invert().multiply(upright.avatar));
    } else if (pose === 'eat' && prop?.parent && dish !== 'bread') {
      const head = avatar.getObjectByName('Dau')!;
      head.localToWorld(upright.mouth.set(0,.115,.215));
      prop.parent.worldToLocal(upright.mouth);
      avatar.localToWorld(upright.rest.set(0,.05,.6));
      prop.parent.worldToLocal(upright.rest);
      const mouthDistance = upright.mouth.length();
      const tipLength = dish === 'rice' ? .135 : .13;
      prop.scale.set(1,Math.min(1,Math.max(.3,(mouthDistance-.009)/tipLength)),1);
      upright.direction.copy(upright.rest).normalize()
        .lerp(upright.mouth.normalize(),rig.mealLift).normalize();
      prop.quaternion.setFromUnitVectors(upright.axis,upright.direction);
    } else if (prop) { prop.quaternion.identity(); prop.scale.setScalar(1); }
  },pose==='sweep'||pose==='drawWater'||pose==='pourWater'?-1:0);
  const hand = avatar.getObjectByName('Co_Tay_R');
  const torso=avatar.getObjectByName('Than'),head=avatar.getObjectByName('Dau');
  const leftHand=avatar.getObjectByName('Co_Tay_L');
  return <group ref={bodyVisual} position={[0,seated ? 0 : -.025,seated && !chair ? -.06 : 0]}>
    <primitive object={avatar} scale={[CHIBI_SWEEP.modelScaleX, 1, CHIBI_SWEEP.modelScaleZ]} />
    {gender==='female'&&head&&createPortal(<FemaleChibiHair/>,head)}
    {equipment?.neck&&torso&&createPortal(<EquipmentMesh id={equipment.neck}/>,torso)}
    {equipment?.wrist&&leftHand&&createPortal(<group rotation={[Math.PI/2,0,0]}><EquipmentMesh id={equipment.wrist}/></group>,leftHand)}
    {holding&&equipment?.hand&&hand&&createPortal(<group ref={equipmentProp}><EquipmentMesh id={equipment.hand}/></group>,hand)}
    {seated && <ChibiLapRobe robe={robe} chair={chair}/>}
    {apron&&torso&&createPortal(<group position={[0,-.08,.165]}><mesh><planeGeometry args={[.28,.30]}/><meshStandardMaterial color="#ece2c8" side={2} roughness={1}/></mesh><mesh position={[0,.05,.005]}><boxGeometry args={[.12,.06,.008]}/><meshStandardMaterial color="#d1bea0"/></mesh></group>,torso)}
    {apron&&head&&createPortal(<group position={[0,.36,0]}><mesh><cylinderGeometry args={[.21,.20,.085,16]}/><meshStandardMaterial color="#eee5cf"/></mesh><mesh position={[0,.06,0]} scale={[1,.5,1]}><sphereGeometry args={[.23,16,10]}/><meshStandardMaterial color="#eee5cf"/></mesh></group>,head)}
    {hand && createPortal(<group ref={heldProp}>{pose==='tea'?<TeaCup/>:pose==='read'?<ReadingBook motion={rig.quiet}/>:<ChibiHandProp pose={pose} dish={dish}/>}</group>,hand)}
    {pose === 'sweep' && <ChibiBroom frame={sweepFrame} localPlayer={localPlayer}/>}
    {pose==='carryWater'&&<ChibiYoke pouring={false} moving={!!moving}/>}
    {(pose==='drawWater'||pose==='pourWater')&&<ChibiBucket frame={waterFrame} localPlayer={localPlayer}/>}
  </group>;
}

export default function PlayerAvatar(props: PlayerAvatarProps) {
  const equipment=useGame(s=>props.localPlayer?s.equipment:props.equipment);
  return <Suspense fallback={null}>
    <group scale={props.npc?NPC_CHIBI_SCALE:1}><ChibiAvatar {...props} equipment={equipment} /></group>
  </Suspense>;
}
