import {useLayoutEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {MALA_BEADS,type BeadMotion} from './beadMotion';

const total=MALA_BEADS+1;
const loop=new T.CatmullRomCurve3([
  new T.Vector3(0,0,0),new T.Vector3(.057,-.022,.012),new T.Vector3(.103,-.121,.005),
  new T.Vector3(.088,-.238,-.012),new T.Vector3(.017,-.292,-.016),
  new T.Vector3(-.052,-.246,-.01),new T.Vector3(-.078,-.135,.006),new T.Vector3(-.055,-.043,.003),
],true);
const cordGeometry=new T.TubeGeometry(loop,40,.0027,4,true);
const beadGeometry=new T.SphereGeometry(1,8,6);
const cordMaterial=new T.MeshStandardMaterial({color:'#603824',roughness:.96});
const tasselMaterial=new T.MeshStandardMaterial({color:'#963f27',roughness:.92});
const tasselGeometry=new T.LatheGeometry([
  new T.Vector2(0,0),new T.Vector2(.006,0),new T.Vector2(.008,-.009),
  new T.Vector2(.006,-.016),new T.Vector2(.011,-.04),new T.Vector2(0,-.042),
],8);

let woodMaterial:T.MeshStandardMaterial|undefined;
function sandalwoodMaterial(){
  if(woodMaterial)return woodMaterial;
  const width=128,height=64,texels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/width*Math.PI*2,v=y/height*Math.PI*2;
    const warp=.8*Math.sin(v)+.34*Math.sin(u*3-v*2);
    const grain=11*Math.sin(u*13+warp)+6*Math.sin(u*28+warp*2)+5*Math.sin(u*5+v);
    const pores=Math.sin(x*127.1+y*311.7)*43758.5453;
    const value=grain+(pores-Math.floor(pores)-.5)*9;
    const pixel=(y*width+x)*4;
    texels[pixel]=142+value;
    texels[pixel+1]=87+value*.78;
    texels[pixel+2]=48+value*.5;
    texels[pixel+3]=255;
  }
  const map=new T.DataTexture(texels,width,height);
  map.colorSpace=T.SRGBColorSpace;
  map.wrapS=T.RepeatWrapping;
  map.magFilter=T.LinearFilter;
  map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;
  map.needsUpdate=true;
  woodMaterial=new T.MeshStandardMaterial({map,roughness:.57});
  return woodMaterial;
}

export default function PrayerMala({motion}:{motion:BeadMotion}){
  const root=useRef<T.Group>(null),beads=useRef<T.InstancedMesh>(null),tassel=useRef<T.Mesh>(null);
  const working=useRef(new T.Object3D()),lastOffset=useRef(Number.NaN);
  useLayoutEffect(()=>{
    const mesh=beads.current!;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.boundingSphere=new T.Sphere(new T.Vector3(.01,-.15,0),.20);
    const tint=new T.Color();
    for(let i=0;i<total;i++){
      tint.setScalar(.72+(i*19%13)*.027);
      if(i===0)tint.setRGB(1.24,1.13,.90);
      mesh.setColorAt(i,tint);
    }
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  },[]);
  useFrame(()=>{
    if(root.current)root.current.rotation.z=motion.direction*motion.pull*.045;
    const mesh=beads.current;
    if(!mesh||lastOffset.current===motion.offset)return;
    lastOffset.current=motion.offset;
    const bead=working.current;
    for(let i=0;i<total;i++){
      const position=(i/total-motion.offset+1)%1;
      loop.getPointAt(position,bead.position);
      const radius=i===0?.017:.0125+(i%3)*.00035;
      bead.scale.set(radius,radius*(i===0?1.13:.94),radius);
      bead.rotation.set(i*.72,position*Math.PI*2,i*.34);
      bead.updateMatrix();
      mesh.setMatrixAt(i,bead.matrix);
      if(i===0&&tassel.current){
        // Keep the marker's knot outside the strand so the short tassel hangs free.
        const side=bead.position.x>=0?1:-1;
        tassel.current.position.copy(bead.position);
        tassel.current.position.x+=side*.012;
        tassel.current.position.y-=.012;
        tassel.current.rotation.z=side*.35;
      }
    }
    mesh.instanceMatrix.needsUpdate=true;
  });
  return <group ref={root} position={[.013,.073,.028]} rotation={[0,.36,0]}>
    <mesh geometry={cordGeometry} material={cordMaterial} dispose={null}/>
    <instancedMesh ref={beads} args={[beadGeometry,sandalwoodMaterial(),total]} dispose={null}/>
    <mesh ref={tassel} geometry={tasselGeometry} material={tasselMaterial} dispose={null}/>
  </group>;
}
