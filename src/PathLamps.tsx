import {useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';
import {batchGeometry,coloredGeometry,taperTube} from './geometryBatch';
import {pathLamps} from './courtyardPropsData';
import {useGame} from './gameStore';
import type {Vec3} from './gameData';

const iron='#292018',bronze='#805c38',raised='#b18a55';
const box=new THREE.BoxGeometry();
const pieces:THREE.BufferGeometry[]=[];
function block(color:string,x:number,y:number,z:number,w:number,h:number,d:number){
  pieces.push(coloredGeometry(box,color,[x,y,z],[w,h,d]));
}
function squareFrustum(top:number,bottom:number,height:number){
  return new THREE.CylinderGeometry(top*Math.SQRT2,bottom*Math.SQRT2,height,4,1,false,Math.PI/4);
}
function trim(points:Vec3[],radius:number,color:string){
  const line=taperTube(points,points.map(()=>radius),5);
  pieces.push(coloredGeometry(line,color));
  line.dispose();
}
block(iron,0,.017,0,.28,.034,.28);
block(raised,0,.041,0,.249,.016,.249);
block(bronze,0,.061,0,.216,.026,.216);
block(iron,0,.319,0,.153,.495,.153);
block(bronze,0,.562,0,.174,.042,.174);
block(raised,0,.588,0,.214,.014,.214);
block(bronze,0,.834,0,.268,.027,.268);

const glassBottom=.101,glassTop=.126,glassLow=.595,glassHigh=.825;
for(const x of [-1,1])for(const z of [-1,1]){
  trim([[x*glassBottom,glassLow,z*glassBottom],[x*glassTop,glassHigh,z*glassTop]],.009,raised);
  block(raised,x*.128,.819,z*.128,.031,.031,.031);
  block(bronze,x*.076,.32,z*.076,.012,.47,.012);
}

function cap(base:number,half:number,top:number,rise:number,curve:number){
  for(let side=0;side<4;side++){
    const angle=side*Math.PI/2,sin=Math.sin(angle),cos=Math.cos(angle);
    const points:number[]=[],indices:number[]=[];
    const at=(u:number,t:number):Vec3=>{
      const r=THREE.MathUtils.lerp(half,top,t),x=u*r,z=r;
      const y=base+rise*t**1.16+curve*Math.abs(u)**7*(1-t)**3;
      return [x*cos+z*sin,y,z*cos-x*sin];
    };
    for(let i=0;i<=5;i++)for(let j=0;j<=10;j++)points.push(...at(j/5-1,i/5));
    for(let i=0;i<5;i++)for(let j=0;j<10;j++){
      const a=i*11+j,b=a+11;
      indices.push(a,a+1,b,b,a+1,b+1);
    }
    const panel=new THREE.BufferGeometry();
    panel.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    panel.setIndex(indices);
    panel.computeVertexNormals();
    pieces.push(coloredGeometry(panel,iron));
    panel.dispose();
    for(let j=0;j<=10;j++){
      const rib=Array.from({length:6},(_,i)=>at(j/5-1,i/5));
      trim(rib,j%5===0?.004:.0024,j%5===0?raised:bronze);
    }
    trim(Array.from({length:11},(_,j)=>at(j/5-1,0)),.004,raised);
    if(half>.15){
      const edge=at(1,0);
      trim([edge,[edge[0]+.009*cos,edge[1]+.014,edge[2]-.009*sin],
        [edge[0]+.009*cos,edge[1]+.038,edge[2]-.009*sin],
        [edge[0]-.012*cos,edge[1]+.038,edge[2]+.012*sin],
        [edge[0]-.012*cos,edge[1]+.025,edge[2]+.012*sin]],.004,raised);
    }
  }
}
cap(.847,.183,.061,.099,.021);
block(bronze,0,.949,0,.13,.022,.13);
cap(.959,.10,.021,.052,.012);
const finial=squareFrustum(.012,.033,.045);
pieces.push(coloredGeometry(finial,bronze,[0,1.03,0]));
finial.dispose();
const tip=new THREE.SphereGeometry(.012,8,6);
pieces.push(coloredGeometry(tip,raised,[0,1.058,0]));
tip.dispose();
const housing=batchGeometry(pieces);
const glass=squareFrustum(glassTop-.004,glassBottom-.004,glassHigh-glassLow)
  .translate(0,(glassHigh+glassLow)/2,0);

function frostedGlass(){
  const size=64,pixels=new Uint8Array(size*size*4);
  let seed=91;
  for(let i=0;i<pixels.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const grain=(seed>>>24)/255;
    pixels.set([220+25*grain,207+25*grain,178+28*grain,255],i);
  }
  const texture=new THREE.DataTexture(pixels,size,size);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.LinearFilter;
  texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;
  texture.needsUpdate=true;
  return texture;
}
const metal=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.52,roughness:.48,side:THREE.DoubleSide});
const frost=frostedGlass();
const pane=new THREE.MeshStandardMaterial({map:frost,bumpMap:frost,bumpScale:.012,
  roughness:.78,emissive:'#e8ad60',emissiveIntensity:.15});
const litPane=pane.clone();
litPane.emissive.set('#ffca88');
litPane.emissiveIntensity=1.5;
const poolGeometry=new THREE.PlaneGeometry(5.2,5.2).rotateX(-Math.PI/2);
const poolMaterial=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,
  vertexShader:`varying vec2 lampUV;
    void main(){lampUV=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec2 lampUV;
    void main(){
      float r=length(lampUV-.5)*2.0;
      float glow=exp(-r*r*5.6)*(1.0-smoothstep(.56,1.0,r));
      gl_FragColor=vec4(1.0,.59,.27,glow*.22);
    }`,
});

export default function PathLamps(){
  const night=useGame(s=>s.night);
  const frame=useRef<THREE.InstancedMesh>(null),panes=useRef<THREE.InstancedMesh>(null),pools=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const transform=new THREE.Matrix4();
    for(const mesh of [frame.current,panes.current,pools.current]){
      if(!mesh)continue;
      pathLamps.forEach(({x,z},i)=>mesh.setMatrixAt(i,transform.makeTranslation(x,mesh===pools.current?.092:.06,z)));
      mesh.instanceMatrix.needsUpdate=true;
      mesh.computeBoundingSphere();
    }
  },[night]);
  return <group dispose={null}>
    <instancedMesh ref={frame} args={[housing,metal,pathLamps.length]} castShadow receiveShadow/>
    <instancedMesh ref={panes} args={[glass,night?litPane:pane,pathLamps.length]} receiveShadow/>
    {night&&<instancedMesh ref={pools} args={[poolGeometry,poolMaterial,pathLamps.length]} renderOrder={1}/>}
  </group>;
}
