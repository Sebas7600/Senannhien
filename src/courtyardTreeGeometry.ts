import * as THREE from 'three';
import {batchGeometry,coloredGeometry,barkTube} from './geometryBatch';
import {treeBasinParts} from './treeBasinGeometry';
import {COURTYARD_TREE} from './courtyardData';
import {forkedLimb} from './treeBranches';
const parts=treeBasinParts(COURTYARD_TREE.radius,COURTYARD_TREE.wallHeight);
parts.push(coloredGeometry(new THREE.CylinderGeometry(1.78,1.78,.07,24),'#665b42',[0,.07,0]));
const bark=[barkTube([[0,.12,0],[.06,.7,0],[-.06,1.7,.02],[.08,2.8,0],[.02,4.3,0]],[.66,.54,.39,.32,.14],9)];
// Preserve the simplified trunk/basin shadow used by the atlas.
export const courtyardBaseShadowGeometry=batchGeometry([...parts.map(part=>part.clone()),coloredGeometry(bark[0],'#74634e')]);
for(let i=0;i<7;i++){
  const a=i/7*Math.PI*2+.2,dx=Math.sin(a),dz=Math.cos(a);
  bark.push(barkTube([[dx*.17,1.25,dz*.17],[dx*.55,.48,dz*.55],[dx*1.12,.18,dz*1.12],[dx*1.65,.1,dz*1.65]],[.25,.24,.14,.025],6));
}
for(const [angle,reach,rise,diameter,height] of [[.2,1.98,2.12,.29,2.08],[1.55,1.8,1.98,.25,2.39],[2.78,1.65,2.33,.26,2.52],[4.19,1.96,1.99,.28,2.18],[5.56,1.4,2.06,.22,2.83]]){
  bark.push(...forkedLimb([0,height,0],angle,reach,rise,diameter,7).geometry);
}
export const courtyardTreeGeometry=batchGeometry(parts);
export const courtyardBarkGeometry=batchGeometry(bark);
export const courtyardTreeMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94});
