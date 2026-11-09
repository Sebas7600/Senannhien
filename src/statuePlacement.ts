import {Box3,Mesh,Vector3,type Object3D} from 'three';
/** A hand/halo may overhang: align the supporting foot, not the full silhouette. */
export function statueFootprint(model:Object3D){
 model.updateMatrixWorld(true);const bounds=new Box3().setFromObject(model),base=new Box3(),point=new Vector3(),cutoff=bounds.min.y+(bounds.max.y-bounds.min.y)*.025;
 model.traverse(node=>{if(!(node instanceof Mesh))return;const positions=node.geometry.attributes.position;for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(node.matrixWorld);if(point.y<=cutoff)base.expandByPoint(point)}});
 return {bounds,base:base.isEmpty()?bounds:base};
}
export function centerStatueOnBase(model:Object3D,height=3.75){const {bounds,base}=statueFootprint(model),center=base.getCenter(new Vector3()),scale=height/(bounds.max.y-bounds.min.y);model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);return model;}
