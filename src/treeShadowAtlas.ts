import * as T from 'three';
import {BODHI} from './bodhiData';
import {courtyardTrees,COURTYARD_TREE} from './courtyardData';
import {canopyGeometry} from './foliage';
import {bodhiTrunkShadowGeometry} from './bodhiGeometry';
import {courtyardBaseShadowGeometry} from './courtyardTreeGeometry';

export const COURTYARD_SUN=new T.Vector3(-28,24,6);
export const TREE_SHADOW_TILE=128;
export const TREE_SHADOW_STRENGTH={day:.18,night:.05} as const;
export const TREE_SHADOW_TREES=[
  {id:'bodhi',x:BODHI.x,y:BODHI.ground+.5,z:BODHI.z,sx:1.9,sy:1.55,angle:0},
  ...courtyardTrees.map((tree,index)=>({...tree,y:COURTYARD_TREE.ground+.7,sx:1.3,sy:1.15,angle:index*.7})),
];
type ShadowTree=typeof TREE_SHADOW_TREES[number];

export function projectTreeShadow(tree:ShadowTree,x:number,y:number,z:number){
  const cos=Math.cos(tree.angle),sin=Math.sin(tree.angle),height=tree.y+y*tree.sy-.071;
  return {x:tree.x+tree.sx*(x*cos+z*sin)-COURTYARD_SUN.x*height/COURTYARD_SUN.y,
    z:tree.z+tree.sx*(-x*sin+z*cos)-COURTYARD_SUN.z*height/COURTYARD_SUN.y};
}

export function projectTreeTrunkShadow(tree:ShadowTree,x:number,y:number,z:number){
  return projectTreeShadow({...tree,y:tree.id==='bodhi'?BODHI.ground:COURTYARD_TREE.ground,sx:1,sy:1},x,y,z);
}

function soften(source:Float32Array,size:number){
  let current=source;
  // Three small separable box filters produce a soft edge without filling in extra leaf detail.
  for(let pass=0;pass<3;pass++){
    const horizontal=new Float32Array(source.length),vertical=new Float32Array(source.length);
    for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
      const i=y*size+x;horizontal[i]=(current[i-1]+current[i]+current[i+1])/3;
    }
    for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
      const i=y*size+x;vertical[i]=(horizontal[i-size]+horizontal[i]+horizontal[i+size])/3;
    }
    current=vertical;
  }
  return current;
}

/** Bake the actual crown and a clean main-trunk silhouette together, without aerial roots or twigs. */
export function createTreeShadowAtlas(){
  const size=TREE_SHADOW_TILE,width=size*2,mask=new Uint8Array(width*width);
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  const bounds:{id:string;minX:number;maxX:number;minZ:number;maxZ:number}[]=[];
  const edge=(ax:number,ay:number,bx:number,by:number,px:number,py:number)=>(px-ax)*(by-ay)-(py-ay)*(bx-ax);
  for(const [tile,tree] of TREE_SHADOW_TREES.entries()){
    const sources=[
      {geometry:canopyGeometry,project:projectTreeShadow},
      {geometry:tree.id==='bodhi'?bodhiTrunkShadowGeometry:courtyardBaseShadowGeometry,project:projectTreeTrunkShadow},
    ].map(({geometry,project})=>{
      const source=geometry.attributes.position;
      return {triangles:geometry.index!,projected:Array.from({length:source.count},(_,i)=>project(tree,source.getX(i),source.getY(i),source.getZ(i)))};
    });
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for(const {projected} of sources)for(const p of projected){
      minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);
    }
    minX-=.65;maxX+=.65;minZ-=.65;maxZ+=.65;
    bounds.push({id:tree.id,minX,maxX,minZ,maxZ});
    const silhouette=new Float32Array(size*size);
    for(const {projected,triangles} of sources){
    const points=projected.map(p=>({x:(p.x-minX)/(maxX-minX)*size,z:(p.z-minZ)/(maxZ-minZ)*size}));
    for(let i=0;i<triangles.count;i+=3){
      const a=points[triangles.getX(i)],b=points[triangles.getX(i+1)],c=points[triangles.getX(i+2)];
      const area=edge(a.x,a.z,b.x,b.z,c.x,c.z);
      if(Math.abs(area)<.0001)continue;
      const sign=Math.sign(area);
      const left=Math.max(1,Math.floor(Math.min(a.x,b.x,c.x))),right=Math.min(size-2,Math.ceil(Math.max(a.x,b.x,c.x)));
      const bottom=Math.max(1,Math.floor(Math.min(a.z,b.z,c.z))),top=Math.min(size-2,Math.ceil(Math.max(a.z,b.z,c.z)));
      for(let y=bottom;y<=top;y++)for(let x=left;x<=right;x++){
        const index=y*size+x;
        if(silhouette[index]===1)continue;
        if(edge(a.x,a.z,b.x,b.z,x+.5,y+.5)*sign>=0&&edge(b.x,b.z,c.x,c.z,x+.5,y+.5)*sign>=0&&edge(c.x,c.z,a.x,a.z,x+.5,y+.5)*sign>=0)silhouette[index]=1;
      }
    }
    }
    const soft=soften(silhouette,size),column=tile%2,row=Math.floor(tile/2);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)mask[(row*size+y)*width+column*size+x]=Math.round(soft[y*size+x]*255);
    const base=tile*4,u=column*.5,v=row*.5;
    positions.push(minX,.071,minZ,minX,.071,maxZ,maxX,.071,maxZ,maxX,.071,minZ);
    uvs.push(u,v,u,v+.5,u+.5,v+.5,u+.5,v);
    indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const map=new T.DataTexture(mask,width,width,T.RedFormat);
  map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;
  map.needsUpdate=true;
  return {geometry,map,mask,width,bounds};
}

export function createTreeShadowMaterial(map:T.DataTexture){
  return new T.ShaderMaterial({
    uniforms:{shadowMap:{value:map},strength:{value:TREE_SHADOW_STRENGTH.day},fogRange:{value:new T.Vector2(42,158)}},
    vertexShader:`varying vec2 shadowUv;varying float shadowDepth;
      void main(){shadowUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);shadowDepth=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform sampler2D shadowMap;uniform float strength;uniform vec2 fogRange;
      varying vec2 shadowUv;varying float shadowDepth;
      void main(){float fade=1.-smoothstep(fogRange.x,fogRange.y,shadowDepth);
        float shadow=texture2D(shadowMap,shadowUv).r*strength*fade;
        gl_FragColor=vec4(vec3(1.)-shadow*vec3(.80,.77,.72),1.);}`,
    blending:T.MultiplyBlending,transparent:true,depthWrite:false,toneMapped:false,
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
  });
}
