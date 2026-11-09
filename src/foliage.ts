import * as THREE from 'three';
import {coloredGeometry,batchGeometry} from './geometryBatch';
import {foliageTexture} from './foliageTexture';
// Crown and leaf details share a single opaque mesh.
const lobes=[
[0,4.25,0,1.3,1,1.2],[-1.2,3.6,.25,1.45,.93,1.1],[1.25,3.65,.3,1.4,.95,1.1],
[0,3.55,1.15,1.55,.92,1.1],[-.7,4.0,-.95,1.4,1,1.2],[1.0,3.95,-.8,1.35,1,1.15],
[-1.9,3.2,-.45,1.08,.8,1.0],[1.9,3.25,-.35,1.08,.85,1.1],[0,3.4,-1.65,1.15,.85,1.1],
[-2.26,3.22,.92,1.08,.68,1.0],[2.12,3.84,-.78,1.12,.78,1.02],[.48,4.79,-.45,1.0,.89,1.02]];
const masses=lobes.map(([x,y,z,sx,sy,sz],i)=>{
  const g=coloredGeometry(new THREE.IcosahedronGeometry(1,i<9?1:0),['#526e40','#5c7747','#64804b','#567345'][i%4],[x,y,z],[sx,sy,sz],[0,i*.8,.1*Math.sin(i)]);
  // Baked sunlit tops and cooler shaded undersides: no extra texture or shader cost.
  const p=g.attributes.position,c=g.attributes.color;
  for(let v=0;v<p.count;v++){const top=THREE.MathUtils.clamp((p.getY(v)-(y-sy))/(2*sy),0,1),shade=.78+top*.28;c.setXYZ(v,c.getX(v)*shade,c.getY(v)*shade,c.getZ(v)*(.92+top*.09));}
  return g;
});
const base=batchGeometry(masses),surface=new THREE.Mesh(base,new THREE.MeshBasicMaterial());surface.updateMatrixWorld();
base.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(base.attributes.position.count*2),2));
base.setAttribute('leafDetail',new THREE.Float32BufferAttribute(new Float32Array(base.attributes.position.count),1));
// Closed, folded heart leaves: ten front and ten back triangles, no alpha cards.
const outline=[[0,0],[-.10,.02],[-.18,.11],[-.16,.25],[-.09,.36],[0,.55],[.09,.36],[.16,.25],[.18,.11],[.10,.02]];
function leafGeometry(){const p:number[]=[],uv:number[]=[],idx:number[]=[];
  // Separate front/back vertices prevent their normals cancelling at the rim.
  for(let face=0;face<2;face++){
    const center=face*11;p.push(0,.21,face?-.006:.014);uv.push(.5,.21/.55);
    for(const [x,y] of outline){p.push(x,y,0);uv.push(x/.36+.5,y/.55)}
    for(let i=0;i<10;i++){const a=center+1+i,b=center+1+(i+1)%10;idx.push(center,...(face?[a,b]:[b,a]))}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  g.setAttribute('leafDetail',new THREE.Float32BufferAttribute(new Float32Array(p.length/3).fill(1),1));return g;
}
const prototype=leafGeometry(),parts=[base],ray=new THREE.Raycaster(),center=new THREE.Vector3(0,3.7,0),zAxis=new THREE.Vector3(0,0,1),object=new THREE.Object3D();
export const FOLIAGE_DETAIL_CLUSTERS=14,LEAVES_PER_CLUSTER=4;
for(let patch=0;patch<FOLIAGE_DETAIL_CLUSTERS;patch++){
  const a=patch*2.399,direction=new THREE.Vector3(Math.sin(a),.12+(patch%3)*.30,Math.cos(a)).normalize();
  ray.set(center.clone().addScaledVector(direction,8),direction.clone().negate());
  const hit=ray.intersectObject(surface)[0];if(!hit)throw new Error('Missing crown surface for leaf patch');
  const normal=hit.face!.normal.clone().normalize(),alignment=new THREE.Quaternion().setFromUnitVectors(zAxis,normal);
  for(let j=0;j<LEAVES_PER_CLUSTER;j++){
    const angle=j*Math.PI*.5+patch*.8,offset=new THREE.Vector3(Math.sin(angle)*.04,Math.cos(angle)*.04,.025+j*.004).applyQuaternion(alignment);
    object.position.copy(hit.point).add(offset);object.quaternion.copy(alignment).multiply(new THREE.Quaternion().setFromAxisAngle(zAxis,angle));object.scale.setScalar(.66+(patch+j)%3*.09);object.updateMatrix();
    const g=prototype.clone();g.applyMatrix4(object.matrix);
    const tint=new THREE.Color(['#829a46','#789241','#90a450','#7f9949'][(patch+j)%4]),colors=new Float32Array(g.attributes.position.count*3);
    for(let v=0;v<g.attributes.position.count;v++){const shade=v===0?1.04:v>=11?.88:1;colors[v*3]=tint.r*shade;colors[v*3+1]=tint.g*shade;colors[v*3+2]=tint.b*shade;}
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(g);
  }
}
prototype.dispose();(surface.material as THREE.Material).dispose();
export const canopyGeometry=batchGeometry(parts);
export const foliageMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94});
foliageMaterial.onBeforeCompile=shader=>{
  shader.uniforms.uLeafSurface={value:foliageTexture};
  shader.vertexShader='attribute float leafDetail; varying float vLeafDetail; varying vec2 vLeafUv; varying vec3 vFoliagePosition; varying vec3 vFoliageNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLeafDetail=leafDetail;vLeafUv=uv;vFoliagePosition=position;vFoliageNormal=normal;');
  shader.fragmentShader='uniform sampler2D uLeafSurface; varying float vLeafDetail; varying vec2 vLeafUv; varying vec3 vFoliagePosition; varying vec3 vFoliageNormal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 an=abs(vFoliageNormal);
    vec2 surfaceUv=an.y>max(an.x,an.z)?vFoliagePosition.xz:an.x>an.z?vFoliagePosition.zy:vFoliagePosition.xy;
    vec2 leafSample=texture2D(uLeafSurface,mix(surfaceUv*1.65,vLeafUv,vLeafDetail)).rg;
    float surfaceShade=.94+leafSample.r*.12;
    float leafShade=.90+leafSample.r*.13+leafSample.g*.13;
    diffuseColor.rgb*=mix(surfaceShade,leafShade,vLeafDetail);`);
};
foliageMaterial.customProgramCacheKey=()=> 'opaque-crown-leaf-veins-v1';
