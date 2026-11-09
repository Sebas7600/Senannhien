import {useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';

function lotusPetalGeometry() {
  const vertices:number[] = [], indices:number[] = [];
  const rows = 9, columns = 7;
  for(let row=0;row<rows;row++){
    const t=row/(rows-1);
    const width=Math.sin(Math.PI*t)*.24;
    for(let col=0;col<columns;col++){
      const u=col/(columns-1)*2-1;
      vertices.push(u*width,t*.40,.08+t*.55+Math.sin(Math.PI*t)*.07*(1-u*u));
    }
  }
  for(let row=0;row<rows-1;row++)for(let col=0;col<columns-1;col++){
    const a=row*columns+col;
    indices.push(a,a+columns,a+1,a+1,a+columns,a+columns+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export default function CenterLotusPedestal() {
  const petals=useRef<THREE.InstancedMesh>(null);
  const geometry=useMemo(lotusPetalGeometry,[]);
  useLayoutEffect(()=>{
    if(!petals.current)return;
    const object=new THREE.Object3D(),color=new THREE.Color();
    for(let row=0;row<2;row++)for(let i=0;i<16;i++){
      const angle=(i+(row?.5:0))*Math.PI/8;
      object.position.set(Math.sin(angle)*.59,.055+row*.10,Math.cos(angle)*.59);
      object.rotation.set(row?-.12:.10,angle,0);
      object.scale.setScalar(row?.88:1);
      object.updateMatrix();
      petals.current.setMatrixAt(row*16+i,object.matrix);
      petals.current.setColorAt(row*16+i,color.set(row?'#e3b94f':'#c69a37'));
    }
    petals.current.instanceMatrix.needsUpdate=true;
    petals.current.computeBoundingSphere();
  },[]);
  return <group>
    <mesh position={[0,.055,0]} receiveShadow>
      <cylinderGeometry args={[1.03,.96,.11,40]}/>
      <meshStandardMaterial color="#b48532" metalness={.72} roughness={.38}/>
    </mesh>
    <instancedMesh ref={petals} args={[geometry,undefined,32]} receiveShadow>
      <meshStandardMaterial metalness={.72} roughness={.36} side={THREE.DoubleSide}/>
    </instancedMesh>
    <mesh position={[0,.335,0]} receiveShadow>
      <cylinderGeometry args={[.94,.97,.09,40]}/>
      <meshStandardMaterial color="#dfb347" metalness={.72} roughness={.38}/>
    </mesh>
  </group>;
}
