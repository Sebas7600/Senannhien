import * as T from 'three';

export function createFallenLeafGeometry(capacity:number){
  const geometry=new T.PlaneGeometry(1.234,2,2,2);
  const {position,uv}=geometry.attributes;
  // Move the center row into the widest part of the blade and lift the rib and tips.
  const curl=[.035,.075,.025,.015,.17,.07,.02,.14,.03];
  for(let i=0;i<position.count;i++){
    if(i>=3&&i<6){
      position.setY(i,.22);
      uv.setY(i,.61);
    }
    position.setZ(i,curl[i]);
  }
  geometry.computeVertexNormals();
  geometry.setAttribute('leafVariant',new T.InstancedBufferAttribute(new Float32Array(capacity),1));
  geometry.computeBoundingSphere();
  return geometry;
}

export function leafVariant(seed:number){const n=seed%10;return n<2?2:n<7?0:1;}

export function createFallenLeafMaterial(atlas:T.Texture){
  // Photos carry straight sRGB colour. Let Three/WebGL perform its standard decode;
  // dividing by coverage in the fragment shader can blow edge colours out to white.
  if(atlas.premultiplyAlpha||atlas.colorSpace!==T.SRGBColorSpace||atlas.anisotropy!==4){
    atlas.premultiplyAlpha=false;
    atlas.colorSpace=T.SRGBColorSpace;
    atlas.anisotropy=4;
    atlas.needsUpdate=true;
  }
  const material=new T.MeshStandardMaterial({
    map:atlas,color:0xf0e7d5,roughness:.84,side:T.DoubleSide,
    // With alpha-to-coverage Three omits OPAQUE and writes fractional framebuffer
    // alpha. Browser compositing can then reveal the light page as a white outline.
    // An opaque cutout discards outside pixels and writes alpha=1 for every survivor.
    alphaTest:.52,transparent:false,depthWrite:true,alphaToCoverage:false,
  });
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float leafVariant;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      #ifdef USE_MAP
        vMapUv=(vMapUv+vec2(mod(leafVariant,2.0),1.0-floor(leafVariant/2.0)))*0.5;
      #endif`);
    // Keep the standard map fragment intact: alpha only controls the cutout/coverage,
    // never the RGB intensity. The opaque shader path also forces output alpha to 1.
  };
  material.customProgramCacheKey=()=> 'bodhi-photo-atlas-v5-opaque-cutout';
  return material;
}
