import ChibiLapRobe from './ChibiLapRobe';
import {ChibiBroom, ChibiHandProp, ChibiYoke} from './ChibiProps';
import {createChibiPose} from './chibiPose';
import {Suspense, useEffect, useMemo, useRef} from 'react';
import {createPortal, useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {AnimationMixer, Color, MathUtils, Group, Mesh, Quaternion, SkinnedMesh, Vector3} from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import RealisticCharacter, {type CharacterProps} from './RealisticCharacter';
import {useReducedMotion} from './useReducedMotion';
import {ReadingBook,TeaCup} from './QuietActivityProps';

const modelUrl = '/assets/characters/thay-chua-chibi.glb';

type PlayerAvatarProps = CharacterProps & {running?: boolean; stairsDirection?: -1|0|1};

function ChibiAvatar({moving, running, stairsDirection = 0, localPlayer, dish, pose = 'walk', seated = false, chair = false, bowMode, bowStartedAt, bowElapsed, robe = '#9b704a', skin = '#c99c79'}: PlayerAvatarProps) {
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
  const upright = useMemo(() => ({parent:new Quaternion(),avatar:new Quaternion(), mouth:new Vector3(), direction:new Vector3(), axis:new Vector3(0,1,0), rest:new Vector3(), leftHand:new Vector3(), rightHand:new Vector3()}),[]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    if (bodyVisual.current) {
      const visualHeight = seated ? 0 : moving && stairsDirection === 1 ? -.085 : -.025;
      bodyVisual.current.position.z = MathUtils.damp(bodyVisual.current.position.z,seated && !chair ? -.06 : 0,16,dt);
      bodyVisual.current.position.y = MathUtils.damp(bodyVisual.current.position.y,visualHeight,16,dt);
    }
    rig.restore();
    mixer.update(dt);
    rig.update(pose,seated,chair,dt,bowMode,bowElapsed ?? (bowStartedAt === undefined ? undefined : (Date.now()-bowStartedAt)/1000),stairsDirection,!!moving,reduced);
    const prop = heldProp.current;
    if (prop) prop.position.set(0,0,0);
    if ((pose === 'tea' || pose === 'read') && prop?.parent) {
      if(pose==='read'){
        avatar.localToWorld(upright.rest.set(0,.30+rig.quiet.breath,.34));
        prop.position.copy(prop.parent.worldToLocal(upright.rest));
      }
      avatar.getWorldQuaternion(upright.avatar);
      prop.parent.getWorldQuaternion(upright.parent);
      prop.quaternion.copy(upright.parent.invert().multiply(upright.avatar));
      upright.parent.setFromAxisAngle(upright.direction.set(1,0,0),pose==='tea'?-rig.quiet.cupTilt:-.32);
      prop.quaternion.multiply(upright.parent);prop.scale.setScalar(1);
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
  });
  const hand = avatar.getObjectByName('Co_Tay_R');
  return <group ref={bodyVisual} position={[0,seated ? 0 : -.025,seated && !chair ? -.06 : 0]}>
    <primitive object={avatar} scale={[1.08, 1, 1.10]} />
    {seated && <ChibiLapRobe robe={robe} chair={chair}/>}
    {hand && createPortal(<group ref={heldProp}>{pose==='tea'?<TeaCup/>:pose==='read'?<ReadingBook motion={rig.quiet}/>:<ChibiHandProp pose={pose} dish={dish}/>}</group>,hand)}
    {pose === 'sweep' && <ChibiBroom localPlayer={localPlayer}/>}
    {(pose === 'carryWater' || pose === 'pourWater') && <ChibiYoke pouring={pose==='pourWater'} moving={!!moving}/>}
  </group>;
}

export default function PlayerAvatar(props: PlayerAvatarProps) {
  if (props.gender === 'female') return <RealisticCharacter {...props} />;
  return <Suspense fallback={null}>
    <ChibiAvatar {...props} />
  </Suspense>;
}
