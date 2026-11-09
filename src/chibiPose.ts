import {OFFERING_DURATION} from './gameData';
import {Euler, Quaternion, Vector3, type Object3D} from 'three';
import {sampleBow, type BowFrame, type BowMode} from './bowTimeline';
import {createQuietActivityFrame,sampleQuietActivity} from './quietActivityMotion';
import {drumStroke} from './drumMotion';

const joints = ['Hong','Than','Dau','Vai_L','Vai_R','Khuyu_L','Khuyu_R','Dui_L','Dui_R','Goi_L','Goi_R','Co_Chan_L','Co_Chan_R'] as const;
type Joint = typeof joints[number];
const euler = new Euler();
const target = new Quaternion();
const offset = new Quaternion();

export function createChibiPose(model: Object3D) {
  const bones = new Map(joints.map(name => [name, model.getObjectByName(name)!]));
  const rotations = new Map(joints.map(name => [name, bones.get(name)!.quaternion.clone()]));
  const hip = bones.get('Hong')!;
  const hipY = hip.position.y;
  const bow: BowFrame = {kneel:0, bend:0, reach:0, done:false};
  const quiet=createQuietActivityFrame();
  let mealLift = 0, seatedElapsed = 0, wasSeated = false;
  const rendered = new Map(joints.map(name => [name, bones.get(name)!.quaternion.clone()]));
  let action = 'walk', elapsed = 0, weight = 0, hipBeforePose = hipY;
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

  function reachHand(side: 'L'|'R', destination: Vector3) {
    const upper = bones.get(side === 'L' ? 'Vai_L' : 'Vai_R')!;
    const forearm = bones.get(side === 'L' ? 'Khuyu_L' : 'Khuyu_R')!;
    const wrist = model.getObjectByName('Co_Tay_' + side)!;
    upper.getWorldPosition(shoulder);
    model.worldToLocal(shoulder);
    delta.copy(destination).sub(shoulder);
    const upperLength = forearm.position.length(), lowerLength = wrist.position.length();
    const distance = Math.max(.07,Math.min(delta.length(),upperLength+lowerLength-.004));
    delta.normalize();
    const along = (upperLength**2-lowerLength**2+distance**2)/(2*distance);
    pole.set(side==='L'?1:-1,-.65,-.15).addScaledVector(delta,-pole.dot(delta)).normalize();
    elbow.copy(shoulder).addScaledVector(delta,along).addScaledVector(pole,Math.sqrt(Math.max(0,upperLength**2-along**2)));
    hand.copy(shoulder).addScaledVector(delta,distance);
    aim(side === 'L' ? 'Vai_L' : 'Vai_R',forearm,elbow);
    aim(side === 'L' ? 'Khuyu_L' : 'Khuyu_R',wrist,hand);
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
      for (const name of joints) bones.get(name)!.quaternion.copy(previous.get(name)!);
      hip.position.y = hipBeforePose;
    },
    update(pose: string, seated: boolean, chair: boolean, dt: number, bowMode?: BowMode, bowElapsed?: number, stairs: -1|0|1 = 0, moving = false, reduced = false) {
      if (action !== pose) { action = pose; elapsed = 0; }
      elapsed += dt;
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
      if (walking && stairBlend < .001) { weight = 0; return; }

      for (const name of joints) previous.get(name)!.copy(bones.get(name)!.quaternion);
      hipBeforePose = hip.position.y;
      try {
      const cycle = Math.sin(elapsed * 6);
      if (walking) { applyStairGait(); return; }
      if (pose === 'bow') sampleBow(bowElapsed ?? elapsed,bowMode ?? (seated?'cushion':'standing'),bow);
      const kneel = seated ? 1 : pose === 'bow' ? bow.kneel : 0;
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
      if (pose === 'bow') {
        const lean = bow.bend * (seated ? .39 : .49);
        turn('Than',lean);
        turn('Dau',.12*bow.reach);
        const palmHeight = hip.position.y + .27 - .22*bow.reach;
        reachHand('L',point.set(.04+.08*bow.reach,palmHeight,.22+.19*bow.reach));
        reachHand('R',point.set(-.04-.08*bow.reach,palmHeight,.22+.19*bow.reach));
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
      }
    },
  };
}
