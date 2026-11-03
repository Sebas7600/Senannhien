import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {CUSHION,type CushionLOD} from './cushionData';
const bodyProfile=[[0,.008],[.52,.012],[.61,.035],[.63,.10],[.61,.16]];
const topProfile=[[.61,.16],[.58,.19],[.44,.207],[.23,.218],[0,CUSHION.height]];
function createCushion(segments:number){
  const body=new THREE.LatheGeometry(bodyProfile.map(([r,y])=>new THREE.Vector2(r,y)),segments);
  const top=new THREE.LatheGeometry(topProfile.map(([r,y])=>new THREE.Vector2(r,y)),segments);
  const rim=new THREE.TorusGeometry(.615,.013,4,segments);rim.rotateX(-Math.PI/2);rim.translate(0,.163,0);
  const parts=[body,top,rim];
  parts.forEach((g,part)=>{const p=g.attributes.position,uv=g.attributes.uv,colors=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){
      if(part===0){const around=uv.getX(i);uv.setXY(i,.004+around*.992,.018+p.getY(i)/.16*.18);}
      else uv.setXY(i,(.5+p.getX(i)/(CUSHION.radius*2)*.965)*.75,.25+(.5-p.getZ(i)/(CUSHION.radius*2)*.965)*.75);
      const tone=part===0?.86:part===2?.9:1;colors[i*3]=tone;colors[i*3+1]=tone;colors[i*3+2]=tone;
    }
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  });
  const combined=mergeGeometries(parts,false)!,result=mergeVertices(combined,.00001);combined.dispose();parts.forEach(g=>g.dispose());result.computeBoundingBox();result.computeBoundingSphere();return result;
}
export const cushionNearGeometry=createCushion(40),cushionFarGeometry=createCushion(20);
export const cushionGeometry=(lod:CushionLOD)=>lod==='near'?cushionNearGeometry:cushionFarGeometry;
