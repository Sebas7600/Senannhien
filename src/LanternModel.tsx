import {useEffect,useMemo,useRef,type ComponentType} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {SacredCandle} from './FireEffects';
import {flameFlicker} from './fireMotion';
import {useReducedMotion} from './useReducedMotion';
import type {Vec3} from './gameData';

const profile=new THREE.CatmullRomCurve3([[.065,0],[.11,.16],[.23,.40],[.34,.75],[.32,.98],[.21,1.17],[.07,1.28]].map(([x,y])=>new THREE.Vector3(x,y,0))).getPoints(24);
const silkGeometry=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(p.x,p.y)),24);
const ribsGeometry=mergeGeometries(Array.from({length:12},(_,i)=>{
  const angle=i*Math.PI/6,curve=new THREE.CatmullRomCurve3(profile.map(p=>new THREE.Vector3(Math.cos(angle)*(p.x+.005),p.y,Math.sin(angle)*(p.x+.005))));
  return new THREE.TubeGeometry(curve,20,.007,3,false);
}));
const fixtureGeometry=mergeGeometries([0,1.28].map(y=>new THREE.CylinderGeometry(.075,.075,.055,12).translate(0,y,0)));
const tasselGeometry=mergeGeometries([
  new THREE.CylinderGeometry(.006,.006,.13,5).translate(0,-.09,0),
  new THREE.SphereGeometry(.032,8,6).translate(0,-.17,0),
  new THREE.ConeGeometry(.038,.19,8).translate(0,-.28,0),
]);
const inkGeometry=mergeGeometries([
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,.27,.18),new THREE.Vector3(-.015,.62,.344),new THREE.Vector3(.02,1.06,.27)]),12,.009,3,false),
  ...Array.from({length:6},(_,i)=>{const side=i%2?1:-1,y=.45+i*.075;return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,y,.32),new THREE.Vector3(side*.09,y+.05,.32),new THREE.Vector3(side*.16,y+.10,.29)),5,.013,3,false)}),
]);
const colors=['#e7b86b','#c76348','#cca45d','#93a36d'];
const bamboo=new THREE.MeshStandardMaterial({color:'#8d7047',roughness:.8});
const tassel=new THREE.MeshStandardMaterial({color:'#bb8a4c',roughness:.9});
const ink=new THREE.MeshStandardMaterial({color:'#59624a',roughness:1});

/** Hội An silhouette: ribbed silk shade, narrow collars and a hanging tassel. */
export function HoiAnLantern({variant=0}:{variant?:number}){
  const material=useMemo(()=>new THREE.MeshStandardMaterial({color:colors[Math.abs(variant)%colors.length],emissive:'#ffd68b',emissiveIntensity:.4,roughness:.78,side:THREE.FrontSide,transparent:true,opacity:.72,depthWrite:false,forceSinglePass:true}),[variant]);
  const reduced=useReducedMotion();
  useEffect(()=>()=>material.dispose(),[material]);
  useFrame(({clock})=>{material.emissiveIntensity=.40*flameFlicker(clock.elapsedTime,variant+2,reduced)});
  return <group dispose={null}>
  <mesh geometry={silkGeometry} material={material}/>
  <mesh geometry={ribsGeometry} material={bamboo}/><mesh geometry={fixtureGeometry} material={bamboo}/>
  <mesh geometry={tasselGeometry} material={tassel}/>
  {variant%4===0&&<mesh geometry={inkGeometry} material={ink}/>}
</group>}

export interface LanternSkin {Model:ComponentType<{variant?:number}>;flamePosition:Vec3;flameScale:number;candleHeight:number}
/** Replace Model and these anchors to change the artwork without touching flight, wishes or timing. */
export const defaultLanternSkin:LanternSkin={Model:HoiAnLantern,flamePosition:[0,.48,0],flameScale:1.7,candleHeight:.23};
export function LanternPresentation({variant=0,skin=defaultLanternSkin}:{variant?:number;skin?:LanternSkin}){
  const {Model,flamePosition,flameScale,candleHeight}=skin;
  const root=useRef<THREE.Group>(null);
  return <group ref={root}>
    <Model variant={variant}/>
    <SacredCandle position={[flamePosition[0],flamePosition[1]-candleHeight-.009,flamePosition[2]]} height={candleHeight} radius={.044} flameScale={flameScale} seed={variant+2}/>
  </group>;
}
