import {useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {useReducedMotion} from './useReducedMotion';
import {createLeafPool,advanceLeaf,collectLeaf,sampleLeaf,leafSources,LEAVES,type LeafPose} from './leafSimulation';

// Folded opaque silhouette, a pale midrib from vertex colors; no image, alpha map or physics body.
const outline=[[-.55,-.65],[-.8,-.15],[-.7,.4],[-.3,.75],[0,.57],[.3,.75],[.7,.4],[.8,-.15],[.55,-.65],[0,-1]];
export const fallenLeafGeometry=new THREE.BufferGeometry();
const positions=[0,-.05,.1,...outline.flatMap(([x,y])=>[x,y,0])],colors=[1.15,1.15,.95,...outline.flatMap(()=>[.84,.88,.78])],indices:number[]=[];
for(let i=0;i<outline.length;i++)indices.push(0,i+1,(i+1)%outline.length+1);
fallenLeafGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));fallenLeafGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));fallenLeafGeometry.setIndex(indices);fallenLeafGeometry.computeVertexNormals();fallenLeafGeometry.computeBoundingSphere();
const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
const palette=['#ad9b62','#a99b69','#b6a16f','#a1a36b'];
export default function TreeLeaves(){
  const mesh=useRef<THREE.InstancedMesh>(null),pool=useMemo(()=>createLeafPool(Date.now()),[]),quality=useGame(s=>s.quality),reduced=useReducedMotion();
  const slots=useMemo(()=>quality==='low'?pool.filter(s=>s.index%2===0):pool,[pool,quality]),object=useRef(new THREE.Object3D()),color=useRef(new THREE.Color()),pose=useRef<LeafPose>({x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:0}),lastSweep=useRef(0);
  useLayoutEffect(()=>{if(!mesh.current)return;mesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.current.count=slots.length;for(let i=0;i<slots.length;i++){slots[i].dirty=true;mesh.current.setColorAt(i,color.current.set(palette[slots[i].seed%palette.length]));}mesh.current.instanceColor!.needsUpdate=true;
    const box=new THREE.Box3(),padding=LEAVES.sweepRange+.7;for(const s of leafSources){box.expandByPoint(new THREE.Vector3(s.x-s.maxRadius-padding,0,s.z-s.maxRadius-padding));box.expandByPoint(new THREE.Vector3(s.x+s.maxRadius+padding,s.canopyY+1,s.z+s.maxRadius+padding));}mesh.current.boundingSphere=box.getBoundingSphere(new THREE.Sphere());
  },[slots,reduced]);
  useFrame(()=>{const m=mesh.current;if(!m||document.hidden)return;const now=Date.now(),state=useGame.getState(),sweep=state.action==='sweep'&&now-lastSweep.current>=100;if(sweep)lastSweep.current=now;let collected=0,changed=false;
    for(let i=0;i<slots.length;i++){const slot=slots[i];advanceLeaf(slot,now);if(sweep&&collectLeaf(slot,now,state.position[0],state.position[1],state.heading))collected++;
      const moving=(!reduced&&now-slot.fallAt<LEAVES.fallMs)||(!reduced&&slot.collectedAt>0&&now-slot.collectedAt<LEAVES.gatherMs);
      if(!moving&&!slot.dirty)continue;sampleLeaf(slot,now,reduced,pose.current);const p=pose.current;object.current.position.set(p.x,p.y,p.z);object.current.rotation.set(p.rx,p.ry,p.rz);object.current.scale.setScalar(p.scale);object.current.updateMatrix();m.setMatrixAt(i,object.current.matrix);changed=true;
      // One final write at landing/gather completion; static matrices are then left untouched.
      slot.dirty=moving;
    }
    if(changed)m.instanceMatrix.needsUpdate=true;
    if(collected){const before=state.progress.sweep;state.record('sweep',collected);if(Math.floor((before+collected)/5)>Math.floor(before/5))state.notify('Lá đã về cội. Sân chùa gọn hơn một chút.');}
  });
  return <instancedMesh name="La-rung-ba-goc-cay" ref={mesh} args={[fallenLeafGeometry,material,LEAVES.perTree*leafSources.length]} receiveShadow dispose={null}/>;
}
