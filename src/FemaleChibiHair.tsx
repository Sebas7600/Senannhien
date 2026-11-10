import {MathUtils,SphereGeometry} from 'three';

function makeHairCap(){
  const columns=32,rows=16;
  const geometry=new SphereGeometry(1,columns,rows,0,Math.PI*2,0,1.38);
  const {position,normal}=geometry.attributes;
  for(let row=0;row<=rows;row++){
    for(let column=0;column<=columns;column++){
      const azimuth=column/columns*Math.PI*2;
      const back=MathUtils.smoothstep(-Math.sin(azimuth),-.15,.70);
      const angle=row/rows*MathUtils.lerp(1.38,2.25,back);
      const x=-Math.cos(azimuth)*Math.sin(angle);
      const y=Math.cos(angle);
      const z=Math.sin(azimuth)*Math.sin(angle);
      const index=row*(columns+1)+column;
      position.setXYZ(index,x,y,z);
      normal.setXYZ(index,x,y,z);
    }
  }
  return geometry;
}

const hairCap=makeHairCap();

/** Hair stays in head-bone coordinates, so bows and seated poses carry it naturally. */
export default function FemaleChibiHair(){
  return <group name="female-chibi-hair">
    <mesh geometry={hairCap} position={[0,.23,-.015]} scale={[.282,.285,.245]} castShadow>
      <meshStandardMaterial color="#30271f" roughness={.88}/>
    </mesh>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[side*.243,.23,-.015]} scale={[.052,.18,.17]} castShadow>
        <sphereGeometry args={[1,12,10]}/><meshStandardMaterial color="#30271f" roughness={.88}/>
      </mesh>
      <mesh position={[side*.105,.401,.155]} rotation={[0,0,side*.28]} scale={[.139,.07,.055]} castShadow>
        <sphereGeometry args={[1,14,8]}/><meshStandardMaterial color="#30271f" roughness={.88}/>
      </mesh>
    </group>)}
    <mesh position={[0,.16,-.235]} scale={[.14,.115,.105]} castShadow>
      <sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#30271f" roughness={.88}/>
    </mesh>
    <mesh position={[0,.16,-.29]} rotation={[Math.PI/2,0,0]}>
      <torusGeometry args={[.089,.012,6,16]}/><meshStandardMaterial color="#9d8260" roughness={.92}/>
    </mesh>
  </group>;
}
