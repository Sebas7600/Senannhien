import * as T from 'three';
import {templeParts} from './templeGeometry';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Extract the actual main-hall roof and normalize its footprint for the other buildings. */
export function createTempleRoofTemplate(scene:T.Group){
 const roof=new T.Group();scene.updateMatrixWorld(true);
 scene.traverse(node=>{if(!(node instanceof T.Mesh)||!node.geometry.index)return;const material=node.material as T.MeshStandardMaterial,indices:number[]=[];
  for(const part of templeParts(node.geometry)){const size=part.box.getSize(new T.Vector3()).multiplyScalar(.5),column=size.y>2.5&&size.x<.9&&size.z<.9;if(!column&&(material.name.startsWith('roof')||part.box.min.y>10.8))indices.push(...part.indices);}
  if(!indices.length)return;const cut=node.geometry.clone();cut.setIndex(indices);const expanded=cut.toNonIndexed(),geometry=mergeVertices(expanded);cut.dispose();expanded.dispose();geometry.applyMatrix4(node.matrixWorld);geometry.computeBoundingBox();roof.add(new T.Mesh(geometry,material));
 });
 const bounds=new T.Box3().setFromObject(roof),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 const normalize=new T.Matrix4().makeScale(1/size.x,1/Math.max(size.x,size.z),1/size.z).multiply(new T.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));
 roof.traverse(node=>{if(!(node instanceof T.Mesh))return;node.geometry.applyMatrix4(normalize);node.castShadow=true;node.receiveShadow=true;});
 return roof;
}

const roofTemplates=new WeakMap<T.Group,T.Group>();
export function cachedTempleRoofTemplate(scene:T.Group){let roof=roofTemplates.get(scene);if(!roof){roof=createTempleRoofTemplate(scene);roofTemplates.set(scene,roof);}return roof;}
