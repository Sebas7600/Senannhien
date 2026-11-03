import * as THREE from 'three';
import {batchGeometry,coloredGeometry,taperTube} from './geometryBatch';
import {treeBasinParts} from './treeBasinGeometry';
import {COURTYARD_TREE} from './courtyardData';
const parts=treeBasinParts(COURTYARD_TREE.radius,COURTYARD_TREE.wallHeight);
parts.push(coloredGeometry(new THREE.CylinderGeometry(1.78,1.78,.07,24),'#665b42',[0,.07,0]));
parts.push(coloredGeometry(taperTube([[0,.12,0],[.06,.7,0],[-.06,1.7,.02],[.08,2.8,0],[.02,4.3,0]],[.66,.54,.39,.32,.14],9),'#74634e'));
for(let i=0;i<7;i++){
  const a=i/7*Math.PI*2+.2,dx=Math.sin(a),dz=Math.cos(a);
  parts.push(coloredGeometry(taperTube([[dx*.17,1.25,dz*.17],[dx*.55,.48,dz*.55],[dx*1.12,.18,dz*1.12],[dx*1.65,.1,dz*1.65]],[.25,.24,.14,.025],6),i%2?'#79674f':'#685a46'));
  parts.push(coloredGeometry(taperTube([[0,2.6,0],[dx*.72,3.6,dz*.72],[dx*1.85,4.3+(i%2)*.3,dz*1.85]],[.23,.19,.035],6),'#7c6a52'));
}
export const courtyardTreeGeometry=batchGeometry(parts);
export const courtyardTreeMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94});
