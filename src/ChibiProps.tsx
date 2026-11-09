import type {DishId} from './gameData';
import {Suspense, useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
import SweepBroom from './SweepBroom';
import WaterYoke from './WaterYoke';
import {createSweepPose,sampleSweepPose,sweepContact} from './sweepMotion';
import {useReducedMotion} from './useReducedMotion';

export function ChibiBroom({localPlayer = false}: {localPlayer?:boolean}) {
  const frame = useMemo(createSweepPose,[]);
  const reduced = useReducedMotion();
  useFrame(() => sampleSweepPose(Date.now(),reduced,frame,localPlayer?sweepContact:null));
  return <Suspense fallback={null}><SweepBroom frame={frame} localPlayer={localPlayer}/></Suspense>;
}

export function ChibiYoke({pouring,moving}: {pouring:boolean;moving:boolean}) {
  const reduced = useReducedMotion();
  return <group scale={.77}><WaterYoke anchor={[-.145/.77,.81/.77,0]} pouring={pouring} moving={moving} reduced={reduced}/></group>;
}

function WateringCan({flow}: {flow:boolean}) {
  const drops = useRef<Group>(null);
  useFrame(({clock}) => {
    drops.current?.children.forEach((drop,index) => {
      const time = (clock.elapsedTime*2.1+index/9)%1;
      drop.position.set(Math.sin(index*2.4)*.018*time,-.03-.38*time*time,.012+.16*time);
    });
  });
  return <group position={[0,-.05,.06]}>
    <mesh><cylinderGeometry args={[.065,.055,.11,12]}/><meshStandardMaterial color="#657d71" roughness={.7}/></mesh>
    <mesh position={[0,.045,-.05]}><torusGeometry args={[.052,.008,6,14]}/><meshStandardMaterial color="#526b5d"/></mesh>
    <mesh position={[0,.005,.092]} rotation={[1.75,0,0]}>
      <cylinderGeometry args={[.015,.024,.15,8]}/><meshStandardMaterial color="#657d71"/>
    </mesh>
    <mesh position={[0,-.008,.163]} rotation={[1.75,0,0]}>
      <cylinderGeometry args={[.028,.021,.025,8]}/><meshStandardMaterial color="#9ba785"/>
    </mesh>
    {flow && <group ref={drops} position={[0,-.008,.179]}>
      {Array.from({length:9},(_,index)=><mesh key={index} scale={[.008,.016,.008]}>
        <sphereGeometry args={[1,6,4]}/><meshBasicMaterial color="#9ed5ea" transparent opacity={.83}/>
      </mesh>)}
    </group>}
  </group>;
}

export function ChibiHandProp({pose,dish}: {pose:string;dish?:DishId}) {
  if(pose==='cook')return <group><mesh position={[0,.2,0]}><cylinderGeometry args={[.009,.012,.4,8]}/><meshStandardMaterial color="#876746"/></mesh><mesh position={[0,.42,0]} scale={[.055,.014,.07]}><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color="#b8b5a0" metalness={.4}/></mesh></group>;
  if(pose==='drum')return <group><mesh position={[0,.38,0]}><cylinderGeometry args={[.017,.021,.76,8]}/><meshStandardMaterial color="#795133"/></mesh><mesh position={[0,.83,0]}><sphereGeometry args={[.075,12,8]}/><meshStandardMaterial color="#b45939" roughness={.95}/></mesh></group>;
  if (pose === 'incense') return <mesh position={[0,.104,.082]}>
    <cylinderGeometry args={[.005,.006,.22,6]}/><meshStandardMaterial color="#93613d"/>
  </mesh>;
  if (pose === 'flower') return <group position={[0,.09,.055]}>
    <mesh><cylinderGeometry args={[.008,.01,.25,6]}/><meshStandardMaterial color="#627d4f"/></mesh>
    <mesh position={[0,.14,0]} scale={[1,.7,1]}><sphereGeometry args={[.046,9,6]}/><meshStandardMaterial color="#df9da9"/></mesh>
  </group>;
  if (pose === 'candle') return <group position={[0,.041,.058]}>
    <mesh><cylinderGeometry args={[.043,.046,.026,12]}/><meshStandardMaterial color="#e9d39b"/></mesh>
    <mesh position={[0,.054,0]} scale={[1,1.65,1]}><sphereGeometry args={[.014,6,4]}/><meshBasicMaterial color="#ffd685"/></mesh>
  </group>;
  if (pose === 'water' || pose === 'drawWater') return <WateringCan flow={pose === 'water'}/>;
  if (pose === 'eat') return <group>
    {dish === 'bread' ? <mesh><capsuleGeometry args={[.035,.105,4,8]}/><meshStandardMaterial color="#c89550"/></mesh>
      : dish === 'rice' ? <>
        <mesh position={[0,.04,0]}><cylinderGeometry args={[.005,.007,.12,6]}/><meshStandardMaterial color="#acafa3"/></mesh>
        <mesh position={[0,.109,0]} scale={[.018,.026,.008]}><sphereGeometry args={[1,8,5]}/><meshStandardMaterial color="#d1d4c6"/></mesh>
      </> : [-1,1].map(side=><mesh key={side} position={[side*.009,.045,0]}>
        <cylinderGeometry args={[.0035,.005,.17,6]}/><meshStandardMaterial color="#71482b"/>
      </mesh>)}
  </group>;
  if (pose === 'mok') return <mesh position={[0,.07,.07]} rotation={[.7,0,.3]}>
    <cylinderGeometry args={[.007,.009,.17,6]}/><meshStandardMaterial color="#876042"/>
  </mesh>;
  if (pose === 'beads') return <group position={[0,-.04,.06]}>{Array.from({length:12},(_,i)=><mesh key={i} position={[Math.cos(i*Math.PI/6)*.036,Math.sin(i*Math.PI/6)*.05,0]}>
    <sphereGeometry args={[.008,5,4]}/><meshStandardMaterial color="#724b33"/>
  </mesh>)}</group>;
  return null;
}
