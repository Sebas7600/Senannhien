import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RigidBody,CylinderCollider,CuboidCollider} from '@react-three/rapier';
import * as THREE from 'three';
import {canopyGeometry,foliageMaterial} from './foliage';
import {bodhiBarkGeometry,bodhiStoneGeometry,bodhiMetalGeometry,bodhiOfferingsGeometry,incenseStickGeometry} from './bodhiGeometry';
import {BODHI,nearBodhiAltar} from './bodhiData';
import {useGame} from './gameStore';
import {useCameraOccluder} from './cameraObstruction';
const barkMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96}),stoneMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.87}),metalMaterial=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.55,roughness:.51}),fruitMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}),stickMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});
function IncenseSmoke({lit}:{lit:boolean}){const ref=useRef<THREE.Points>(null),point=useRef(new THREE.Vector3()),material=useMemo(()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},ratio:{value:1}},vertexShader:`uniform float time;uniform float ratio;varying float fade;void main(){float t=fract(time*.13+position.y);vec3 p=vec3(sin(t*5.+position.x)*.13*t,t*1.25,cos(t*4.+position.x)*.07*t);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((.09+t*.15)*ratio*300./max(-mv.z,.1),1.,50.);fade=(1.-t)*.11;}`,fragmentShader:`varying float fade;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*18.)*fade;gl_FragColor=vec4(.71,.72,.66,a);}`}),[]);
  const geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(Array.from({length:10},(_,i)=>[i*2.399,i/10,0]).flat(),3));return g},[]);
  useFrame(({camera,clock,gl})=>{if(!ref.current)return;const close=camera.position.distanceTo(ref.current.getWorldPosition(point.current))<32;ref.current.visible=lit&&close;if(lit&&close){material.uniforms.time.value=clock.elapsedTime;material.uniforms.ratio.value=Math.min(gl.getPixelRatio(),1.5)}});
  return <points ref={ref} position={[0,1.40,BODHI.altarZ]} geometry={geometry} material={material} frustumCulled={false}/>;
}
function BodhiTree({interactive=true}:{interactive?:boolean}){const crown=useRef<THREE.Mesh>(null);useCameraOccluder(crown);const offerings=useGame(s=>s.bodhiIncense),sticks=useRef<THREE.InstancedMesh>(null),lit=interactive?offerings>0:true;
  useLayoutEffect(()=>{if(!sticks.current)return;const object=new THREE.Object3D(),count=3+Math.min(offerings,9);sticks.current.count=count;for(let i=0;i<count;i++){const angle=i*2.399,r=.02+(i%3)*.025;object.position.set(Math.sin(angle)*r,1.08,BODHI.altarZ+Math.cos(angle)*r);object.rotation.set(Math.sin(i)*.07,0,Math.cos(i)*.07);object.updateMatrix();sticks.current.setMatrixAt(i,object.matrix)}sticks.current.instanceMatrix.needsUpdate=true;sticks.current.computeBoundingSphere()},[offerings]);
  const offer=()=>{const s=useGame.getState();if(!nearBodhiAltar(s.position)){s.stand();s.set({destination:[...BODHI.offeringPoint]});s.notify('Đến trước bàn thờ bồ đề để dâng hương.')}else s.perform('incense')};
  return <group name="Bo-de-tan-khoi" dispose={null}>
    <mesh geometry={bodhiBarkGeometry} material={barkMaterial} castShadow receiveShadow/>
    <mesh ref={crown} position={[0,.5,0]} scale={[1.9,1.55,1.9]} geometry={canopyGeometry} material={foliageMaterial} castShadow receiveShadow/>
    <group onClick={interactive?e=>{if(e.delta>5)return;e.stopPropagation();offer()}:undefined}>
      <mesh geometry={bodhiStoneGeometry} material={stoneMaterial} castShadow receiveShadow/>
      <mesh geometry={bodhiMetalGeometry} material={metalMaterial} castShadow receiveShadow/>
      <mesh geometry={bodhiOfferingsGeometry} material={fruitMaterial} castShadow receiveShadow/>
      <instancedMesh ref={sticks} args={[incenseStickGeometry,stickMaterial,12]} castShadow/>
    </group>
    <IncenseSmoke lit={lit}/>
    {interactive&&<RigidBody type="fixed" colliders={false}><CylinderCollider position={[0,BODHI.wallHeight/2,0]} args={[BODHI.wallHeight/2,BODHI.radius]}/><CylinderCollider position={[0,2,0]} args={[2,1.0]}/><CuboidCollider position={[0,.46,BODHI.altarZ]} args={[.84,.42,.40]}/></RigidBody>}
  </group>;
}
export default memo(BodhiTree);
