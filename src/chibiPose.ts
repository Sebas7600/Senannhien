import {OFFERING_DURATION} from './gameData';
import {Euler, Quaternion, Vector3, type Object3D} from 'three';
import {type BowFrame, type BowMode} from './bowTimeline';
import {createQuietActivityFrame,sampleQuietActivity} from './quietActivityMotion';
import {drumStroke} from './drumMotion';
import type {ServeFrame} from './mealService';
import {chibiSweepGrip,type SweepPose} from './sweepMotion';
import {CHIBI_PRAYER,createChibiBowFrame,sampleChibiBow} from './chibiPracticeMotion';
import type {ChibiWaterFrame} from './chibiWaterMotion';

const joints = ['Hong','Than','Dau','Vai_L','Vai_R','Khuyu_L','Khuyu_R','Co_Tay_L','Co_Tay_R','Dui_L','Dui_R','Goi_L','Goi_R','Co_Chan_L','Co_Chan_R'] as const;
type Joint = typeof joints[number];
const euler = new Euler();
const target = new Quaternion();
const offset = new Quaternion();

export function createChibiPose(model: Object3D) {
  const bones = new Map(joints.map(name => [name, model.getObjectByName(name)!]));
  const rotations = new Map(joints.map(name => [name, bones.get(name)!.quaternion.clone()]));
  const hip = bones.get('Hong')!;
  const hipY = hip.position.y;
  const torso=bones.get('Than')!,torsoRest=torso.position.clone(),torsoBefore=torso.position.clone(),torsoRendered=torso.position.clone();
  const headBone=bones.get('Dau')!,headRest=headBone.position.clone(),headBefore=headBone.position.clone();
  const scales=new Map(joints.map(name=>[name,bones.get(name)!.scale.clone()]));
  const chibiBow=createChibiBowFrame();
  const bow: BowFrame = {kneel:0, bend:0, reach:0, done:false};
  const quiet=createQuietActivityFrame();
  let mealLift = 0, seatedElapsed = 0, wasSeated = false,holdBlend=0;
  const rendered = new Map(joints.map(name => [name, bones.get(name)!.quaternion.clone()]));
  let action = 'walk', elapsed = 0, weight = 0, hipBeforePose = hipY,hipBeforeZ=hip.position.z;
  const previous = new Map(joints.map(name => [name, new Quaternion()]));

  function turn(name: Joint, x: number, y = 0, z = 0) {
    target.copy(rotations.get(name)!).multiply(offset.setFromEuler(euler.set(x,y,z,'YXZ')));
    bones.get(name)!.quaternion.slerp(target,weight);
  }


  const direction = new Vector3(), restDirection = new Vector3(), point = new Vector3();
  const shoulder = new Vector3(), delta = new Vector3(), elbow = new Vector3(), pole = new Vector3();
  const hand = new Vector3();
  const footParent = new Quaternion(), modelHeading = new Quaternion();
  function aim(name: Joint, child: Object3D, destination: Vector3) {
    const joint = bones.get(name)!;
    direction.copy(destination);
    model.localToWorld(direction);
    joint.parent!.worldToLocal(direction);
    direction.sub(joint.position).normalize();
    restDirection.copy(child.position).normalize().applyQuaternion(rotations.get(name)!);
    target.setFromUnitVectors(restDirection,direction).multiply(rotations.get(name)!);
    joint.quaternion.slerp(target,weight);
  }

  function reachHand(side: 'L'|'R', destination: Vector3,leg=false) {
    const upperName:Joint=leg?(side==='L'?'Dui_L':'Dui_R'):(side==='L'?'Vai_L':'Vai_R');
    const lowerName:Joint=leg?(side==='L'?'Goi_L':'Goi_R'):(side==='L'?'Khuyu_L':'Khuyu_R');
    const upper = bones.get(upperName)!;
    const forearm = bones.get(lowerName)!;
    const wrist = model.getObjectByName((leg?'Co_Chan_':'Co_Tay_') + side)!;
    upper.getWorldPosition(shoulder);
    model.worldToLocal(shoulder);
    delta.copy(destination).sub(shoulder);
    const upperLength = forearm.position.length(), lowerLength = wrist.position.length();
    const distance = Math.max(.07,Math.min(delta.length(),upperLength+lowerLength-.004));
    delta.normalize();
    const along = (upperLength**2-lowerLength**2+distance**2)/(2*distance);
    if(leg)pole.set(0,0,1);else pole.set(side==='L'?1:-1,-.65,-.15);
    pole.addScaledVector(delta,-pole.dot(delta)).normalize();
    elbow.copy(shoulder).addScaledVector(delta,along).addScaledVector(pole,Math.sqrt(Math.max(0,upperLength**2-along**2)));
    hand.copy(shoulder).addScaledVector(delta,distance);
    aim(upperName,forearm,elbow);
    aim(lowerName,wrist,hand);
  }
  const serviceFeet={L:new Vector3(),R:new Vector3()};
  function worldAligned(name:Joint,pitch=0,yaw=0,roll=0){
    const bone=bones.get(name)!;footParent.identity();
    // Work inside the avatar: extracting world quaternions from its nonuniform
    // X/Z scale introduces a sideways ankle twist during deep knee bends.
    for(let parent=bone.parent;parent&&parent!==model;parent=parent.parent)footParent.premultiply(parent.quaternion);
    target.copy(footParent.invert()).multiply(offset.setFromEuler(euler.set(pitch,yaw,roll)));
    bone.quaternion.slerp(target,weight);
  }


  let stairBlend = 0;
  let stairLean = 0;
  function applyStairGait() {
    for (const left of [true,false]) {
      const thigh = bones.get(left?'Dui_L':'Dui_R')!;
      const knee = bones.get(left?'Goi_L':'Goi_R')!;
      const ankle = bones.get(left?'Co_Chan_L':'Co_Chan_R')!;
      // The Walk clip already bends the swing knee. Use that phase to lift the thigh.
      const swing = Math.max(0,Math.min(1,(knee.rotation.x-.42)/.55));
      thigh.rotateX(-.17*swing*stairBlend);
      knee.rotateX(.10*swing*stairBlend);
      ankle.rotateX(-.06*swing*stairBlend);
    }
    bones.get('Than')!.rotateX(stairLean);
  }

  return {
    quiet,
    get drumStrike(){return drumStroke(elapsed*1000);},
    get mealLift() { return mealLift; },
    restore() {
      if (!weight) return;
      for (const name of joints){bones.get(name)!.quaternion.copy(previous.get(name)!);bones.get(name)!.scale.copy(scales.get(name)!);}
      torso.position.copy(torsoBefore);
      headBone.position.copy(headBefore);
      hip.position.y = hipBeforePose;
      hip.position.z = hipBeforeZ;
    },
    update(pose: string, seated: boolean, chair: boolean, dt: number, bowMode?: BowMode, bowElapsed?: number, stairs: -1|0|1 = 0, moving = false, reduced = false,service?:ServeFrame,holding=false,sweepFrame?:SweepPose,waterFrame?:ChibiWaterFrame) {
      if (action !== pose) { action = pose; elapsed = 0; }
      elapsed += dt;
      holdBlend+=((holding?1:0)-holdBlend)*(1-Math.exp(-dt*12));
      mealLift = 0;
      sampleQuietActivity(pose,elapsed,quiet,reduced);
      // Changing a seated activity must not blend the pelvis back from standing height.
      const continuingSeat = seated && wasSeated;
      seatedElapsed = seated ? seatedElapsed + dt : 0;
      wasSeated = seated;
      weight = Math.min(1, (seated ? seatedElapsed : elapsed) * 8);
      const walking = pose === 'walk' && !seated;
      const onStairs = walking && moving && stairs !== 0;
      const blend = 1-Math.exp(-dt*12);
      stairBlend += ((onStairs ? 1 : 0)-stairBlend)*blend;
      stairLean += ((onStairs ? (stairs === 1 ? .065 : -.025) : 0)-stairLean)*blend;
      if (walking && stairBlend < .001&&holdBlend<.001) { weight = 0; return; }

      for (const name of joints) previous.get(name)!.copy(bones.get(name)!.quaternion);
      hipBeforePose = hip.position.y;
      hipBeforeZ=hip.position.z;
      torsoBefore.copy(torso.position);
      headBefore.copy(headBone.position);
      try {
      const cycle = Math.sin(elapsed * 6);
      if (walking) { applyStairGait();if(holdBlend>.001){weight*=holdBlend;reachHand('L',point.set(.085,.65,.24));reachHand('R',point.set(-.085,.65,.24));}return; }
      if(pose==='sweep'&&sweepFrame){
        turn('Than',.045);turn('Dau',.12);
        reachHand('L',chibiSweepGrip(sweepFrame,'L',point));
        reachHand('R',chibiSweepGrip(sweepFrame,'R',point));return;
      }
      if((pose==='drawWater'||pose==='pourWater')&&waterFrame){
        headBone.position.z=headRest.z-waterFrame.headBack;
        turn('Than',waterFrame.bend);turn('Dau',waterFrame.headPitch);
        point.copy(waterFrame.rightGrip);point.x/=1.08;point.z/=1.10;reachHand('R',point);
        point.copy(waterFrame.leftGrip);point.x/=1.08;point.z/=1.10;reachHand('L',point);return;
      }
      if(pose==='vendor'){
        // Sellers keep the original standing legs and flat ankles. The serving pose
        // pushes the pelvis forward and is unsuitable for a permanent shop stance.
        hip.position.y=hipY;hip.position.z=0;
        for(const name of ['Dui_L','Dui_R','Goi_L','Goi_R','Co_Chan_L','Co_Chan_R'] as const)turn(name,0);
        turn('Than',.015);turn('Dau',.035);
        reachHand('L',point.set(.18/(1.3*1.08),.85/1.3+.025,.22/(1.3*1.10)));
        reachHand('R',point.set(-.20/(1.3*1.08),.93/1.3+.025,.43/(1.3*1.10)));
        return;
      }
      if(pose==='serve'&&service){
        for(const side of ['L','R'] as const){bones.get(side==='L'?'Co_Chan_L':'Co_Chan_R')!.getWorldPosition(serviceFeet[side]);model.worldToLocal(serviceFeet[side]);}
        hip.position.y=hipY-.018-service.bend*.31;
        hip.position.z=hipBeforeZ+(.075+service.bend*.15)*weight;
        turn('Than',-.12+service.bend*.08);turn('Dau',-.30+service.bend*.05);
        for(const side of ['L','R'] as const){const sign=side==='L'?1:-1;
          reachHand(side,point.set((service.handX+sign*.18)/(1.3*1.08),service.handY/1.3+.025,service.handZ/(1.3*1.10)));
          reachHand(side,serviceFeet[side],true);
        }return;
      }
      if(pose==='cook'){
        const stir=reduced?0:elapsed*4;turn('Than',.12);turn('Dau',.16);
        reachHand('L',point.set(.14,.72,.25));reachHand('R',point.set(-.08+Math.sin(stir)*.035,.78,.29+Math.cos(stir)*.035));return;
      }
      if(pose==='bow'){
        const mode=bowMode??(seated?'cushion':'standing'),frame=sampleChibiBow(bowElapsed??elapsed,mode,chibiBow,bow,hipBeforePose);
        hip.position.y=frame.hipY;hip.position.z=frame.hipZ;
        // Bend at the waist, moving the chest pivot too; rotating only the chest
        // leaves the large chibi head sitting upright over a crouched pelvis.
        torso.position.set(torsoRest.x,torsoRest.y*Math.cos(frame.pitch),torsoRest.y*Math.sin(frame.pitch));
        turn('Than',frame.pitch);turn('Dau',frame.headPitch);
        if(!seated){
          // The pelvis already follows the timed trajectory. Its leg constraints
          // must be solved fully, even while the upper body blends into prayer.
          const upperBodyWeight=weight;weight=1;
          for(const side of ['L','R'] as const){const sign=side==='L'?1:-1;
            reachHand(side,point.set(sign*.08,frame.footY,frame.footZ),true);
            worldAligned(side==='L'?'Co_Chan_L':'Co_Chan_R',frame.footPitch);
          }
          weight=upperBodyWeight;
        }else{
          for(const side of ['L','R'] as const){const sign=side==='L'?1:-1;
            turn(side==='L'?'Dui_L':'Dui_R',-1.39,sign*.78);
            aim(side==='L'?'Goi_L':'Goi_R',bones.get(side==='L'?'Co_Chan_L':'Co_Chan_R')!,point.set(sign*.105,.07,side==='L'?.19:.16));
            worldAligned(side==='L'?'Co_Chan_L':'Co_Chan_R',0,-sign*1.12);
          }
        }
        for(const side of ['L','R'] as const){const sign=side==='L'?1:-1,name=side==='L'?'Co_Tay_L':'Co_Tay_R';
          reachHand(side,point.set(sign*frame.palmX,frame.palmY,frame.palmZ));
          worldAligned(name,-Math.PI/2*frame.contact,0,Math.PI*(1-frame.contact));bones.get(name)!.scale.z=1-frame.contact*.55;
        }return;
      }
      const kneel = seated ? 1 : 0;
      if (kneel) {
        hip.position.y += ((chair ? .13 : seated ? .078 : .11) - hip.position.y) * kneel * weight;
        for (const side of ['L','R'] as const) {
          const sign = side === 'L' ? 1 : -1;
          turn(`Dui_${side}`, (seated && !chair ? -1.39 : -1.47)*kneel, chair ? 0 : sign*(seated ? .78 : .98)*kneel);
          const knee = side === 'L' ? 'Goi_L' : 'Goi_R';
          const foot = side === 'L' ? 'Co_Chan_L' : 'Co_Chan_R';
          if (chair) {
            turn(knee,1.55);
          } else if (seated) {
            // Fold the lower leg inward. Both feet stay tucked inside the knees.
            const ankle = bones.get(foot)!;
            aim(knee,ankle,point.set(sign*.105,.07,side==='L'?.19:.16));
            model.getWorldQuaternion(modelHeading);
            ankle.parent!.getWorldQuaternion(footParent);
            target.copy(footParent.invert()).multiply(modelHeading)
              .multiply(offset.setFromEuler(euler.set(0,-sign*1.12,0)));
            ankle.quaternion.slerp(target,weight);
          } else {
            turn(knee,1.62*kneel);
          }
        }
      }

      if(pose==='carryWater'||pose==='pourWater'){
        turn('Than',pose==='pourWater'?.17:.025);
        reachHand('R',point.set(-.145,pose==='pourWater'?.91:.84,.22));
        reachHand('L',point.set(.16,.52,.15));return;
      }
      if(pose==='drum'){
        const strike=drumStroke(elapsed*1000);turn('Than',.035+strike*.08);turn('Dau',.06);
        reachHand('R',point.set(-.10+strike*.07,.75,.25+strike*.02));
        reachHand('L',point.set(.055,.67,.29+strike*.10));return;
      }
      if (pose === 'tea') {
        turn('Than',.035);
        turn('Dau',.10-.08*quiet.sip);
        const mouth=bones.get('Dau')!.localToWorld(point.set(0,.115,.215));
        model.worldToLocal(mouth);
        const x=-.10+(mouth.x+.075)*quiet.sip;
        const y=.29+(mouth.y-.052-.29)*quiet.sip+quiet.breath;
        const z=.34+(mouth.z+.025-.34)*quiet.sip;
        reachHand('R',point.set(x,y,z));
        reachHand('L',point.set(x+.047,y-.031,z));
        return;
      }
      if (pose === 'read') {
        turn('Than',.055);
        turn('Dau',.23+quiet.breath*2);
        reachHand('R',point.set(-.135,.29+quiet.breath,.34));
        reachHand('L',point.set(.135-.23*quiet.turnHand,.29+Math.sin(quiet.page*Math.PI)*.07+quiet.breath,.34));
        return;
      }
      if (pose === 'meditate' && seated && !chair) {
        turn('Than',.025);
        turn('Dau',.095);
        reachHand('L',point.set(.018,.365,.225));
        reachHand('R',point.set(-.018,.365,.225));
        return;
      }
      if(pose==='pray'||pose==='chant'){
        turn('Than',.02);turn('Dau',.06);
        for(const side of ['L','R'] as const){const sign=side==='L'?1:-1;reachHand(side,point.set(sign*CHIBI_PRAYER.spread,hip.position.y+CHIBI_PRAYER.height,CHIBI_PRAYER.forward));worldAligned(side==='L'?'Co_Tay_L':'Co_Tay_R',0,0,Math.PI);}
        return;
      }
      if (pose === 'eat' && seated) {
        const phase = elapsed % 2.6;
        const lift = Math.sin(Math.PI*Math.min(1,Math.max(0,(phase-.35)/1.85)));
        mealLift = lift;
        turn('Than',.15-.08*lift);
        turn('Dau',.25-.12*lift+Math.sin(elapsed*12)*.025*lift);
        reachHand('L',point.set(.145,.20,.24));
        reachHand('R',point.set(-.09+.06*lift,.17+.39*lift,.29+.055*lift));
        return;
      }
      if (pose === 'incense') {
        const phase = Math.min(elapsed/3,1);
        const lift = Math.sin(Math.PI*Math.min(1,phase*1.65));
        const place = Math.max(0,Math.sin((phase-.56)/.44*Math.PI));
        turn('Than',.07+place*.16);
        turn('Dau',.07+place*.12);
        reachHand('L',point.set(.025,.75+.095*lift-.075*place,.285+.09*place));
        reachHand('R',point.set(-.025,.76+.095*lift-.075*place,.285+.09*place));
        return;
      }
      if (pose === 'water') {
        turn('Than',.19);
        turn('Dau',.20);
        reachHand('R',point.set(-.14,.62,.36));
        reachHand('L',point.set(.06,.57,.32));
        return;
      }
      if (pose === 'flower' || pose === 'candle') {
        const phase = Math.min(1,elapsed*1000/OFFERING_DURATION);
        const ease = (t:number) => { const u = Math.max(0,Math.min(1,t)); return u*u*(3-2*u); };
        const lift = ease(phase/.32);
        const place = ease((phase-.48)/.48);
        const flower = pose === 'flower';
        const y = .69 + lift*(flower?.16:.10) - place*.19;
        const z = .22 + lift*.035 + place*.15;
        const spread = flower ? .047 : .077;
        turn('Than',.04+place*.24);
        turn('Dau',.075+place*.16);
        reachHand('L',point.set(spread,y,z));
        reachHand('R',point.set(-spread,y+(flower?.025:0),z));
        return;
      }
      const tending = pose === 'plant' || pose === 'harvest';
      const pouring = pose === 'water' || pose === 'pourWater' || pose === 'drawWater';
      const joinedHands = pose === 'pray' || pose === 'chant' || pose === 'beads';
      const atTable = pose === 'read' || pose === 'eat' || pose === 'tea';
      const sweep = pose === 'sweep';
      const carry = pose === 'carryWater';
      const feed = pose === 'feed' ? Math.sin(Math.min(elapsed / 1.15,1)*Math.PI) : 0;
      const dip = tending ? .35+.08*cycle : pouring ? .24 : sweep ? .15 : 0;
      turn('Than',dip,sweep ? cycle*.19 : 0);
      turn('Dau',pose === 'meditate' ? .10 : atTable || tending || pouring ? .23 : 0);
      for (const side of ['L','R'] as const) {
        const sign = side === 'L' ? 1 : -1;
        const activeHand = side === 'R';
        const raise = joinedHands ? .83 : tending ? .73+.12*cycle : pouring ? .82 :
          sweep ? .65+sign*cycle*.15 : carry ? .67 : atTable ? .68+(activeHand&&pose!=='read'?.15*cycle:0) :
          pose === 'mok' ? .62+(activeHand?.18*cycle:0) :
          seated ? .48 : 0;
        turn(`Vai_${side}`, -raise-(activeHand ? feed*1.25 : 0), 0,
          sign*(joinedHands ? -.43 : seated || tending || sweep ? -.26 : -.10));
        turn(`Khuyu_${side}`, -(joinedHands ? .86 : atTable ? .65 : .28)-(activeHand?feed*.28:0),0,
          joinedHands ? -sign*.28 : 0);
      }
      } finally {
        // Blend directly from the last displayed pose, not the underlying Idle clip.
        // The shared seated pelvis remains fixed while arms and torso change activity.
        const alpha = continuingSeat ? 1-Math.exp(-dt*18) : 1;
        for (const name of joints) {
          const bone = bones.get(name)!, last = rendered.get(name)!;
          if (continuingSeat) bone.quaternion.copy(last.slerp(bone.quaternion,alpha));
          else last.copy(bone.quaternion);
        }
        if(continuingSeat)torso.position.lerpVectors(torsoRendered,torso.position,alpha);torsoRendered.copy(torso.position);
      }
    },
  };
}
