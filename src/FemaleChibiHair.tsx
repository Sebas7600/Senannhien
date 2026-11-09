/** Hair stays in head-bone coordinates, so bows and seated poses carry it naturally. */
export default function FemaleChibiHair(){
  return <group name="female-chibi-hair">
    <mesh position={[0,.23,-.015]} scale={[.278,.285,.235]} castShadow>
      <sphereGeometry args={[1,20,12,0,Math.PI*2,0,1.38]}/>
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
