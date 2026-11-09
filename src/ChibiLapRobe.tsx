import {useMemo} from 'react';
import {Color, DoubleSide, BufferGeometry, Float32BufferAttribute} from 'three';

export default function ChibiLapRobe({robe, chair}: {robe:string;chair:boolean}) {
  const geometry = useMemo(() => {
    const vertices:number[] = [], colors:number[] = [], indices:number[] = [];
    const rings = chair
      ? [[.05,.221,.09],[.54,.195,.15],[.94,.165,.195],[1,.074,.195],[.96,.015,.193]]
      : [[.05,.192,.025],[.48,.175,.035],[.87,.135,.055],[1,.065,.055],[1.01,.012,.055]];
    const halfWidth = chair ? .245 : .345;
    const halfDepth = chair ? .205 : .285;
    const sections = 32;
    for (const [radius,height,centerZ] of rings) {
      for (let i=0;i<sections;i++) {
        const angle = i*2*Math.PI/sections;
        const fold = Math.cos(angle*8);
        const x = Math.cos(angle)*radius*(halfWidth+.007*fold);
        const kneeDrape = !chair && radius > .7 && radius < 1 ? .045*Math.pow(Math.abs(Math.cos(angle)),3) : 0;
        vertices.push(x,height+kneeDrape+.005*fold*radius,centerZ+Math.sin(angle)*radius*(halfDepth+.007*fold));
        const shade = .89+.09*fold;
        colors.push(shade,shade,shade);
      }
    }
    for(let ring=0;ring<rings.length-1;ring++) for(let i=0;i<sections;i++){
      const a=ring*sections+i,b=ring*sections+(i+1)%sections;
      indices.push(a,b,a+sections,b,b+sections,a+sections);
    }
    for(let i=1;i<sections-1;i++)indices.push(0,i,i+1);
    const mesh = new BufferGeometry();
    mesh.setAttribute('position',new Float32BufferAttribute(vertices,3));
    mesh.setAttribute('color',new Float32BufferAttribute(colors,3));
    mesh.setIndex(indices);
    mesh.computeVertexNormals();
    return mesh;
  },[chair]);
  return <mesh geometry={geometry} castShadow>
    <meshStandardMaterial color={new Color(robe)} vertexColors roughness={.92} side={DoubleSide}/>
  </mesh>;
}
