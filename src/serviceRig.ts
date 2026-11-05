import * as THREE from 'three';
import {skirtCloth,torsoCloth} from './clothGeometry';

export const serviceBodyForward=(bend:number)=>bend*.8;
const base=skirtCloth.getAttribute('position'),torso=torsoCloth.getAttribute('position');
let ringSize=1;
while(ringSize<torso.count&&torso.getY(ringSize)===torso.getY(0))ringSize++;
const topStart=base.count-ringSize,bottom=base.getY(0),top=base.getY(topStart);

export function createServiceGarment(){
  const geometry=skirtCloth.clone(),weights=new Float32Array(base.count);
  for(let i=0;i<weights.length;i++){const t=(base.getY(i)-bottom)/(top-bottom);weights[i]=t*t*(3-2*t);}
  // Fixed bounds cover the entire service motion, avoiding a bounds scan every frame.
  geometry.boundingBox=new THREE.Box3(new THREE.Vector3(-.34,.04,-.32),new THREE.Vector3(.34,1.06,.85));
  geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.55,.25),1.05);
  return {geometry,weights,knee:{y:0,z:0},hips:NaN,forward:NaN,bend:NaN,width:NaN};
}
export type ServiceGarment=ReturnType<typeof createServiceGarment>;

/** Anchor the hem and match every vertex of the waist to the torso's actual lower ring. */
export function updateServiceGarment(g:ServiceGarment,hips:number,forward:number,bend:number,width:number){
  if(g.hips===hips&&g.forward===forward&&g.bend===bend&&g.width===width)return false;
  g.hips=hips;g.forward=forward;g.bend=bend;g.width=width;
  const p=g.geometry.getAttribute('position'),sin=Math.sin(bend),cos=Math.cos(bend),knee=serviceKnee(hips,forward,g.knee),kneeT=(knee.y-bottom)/(hips-bottom);
  for(let i=0;i<p.count;i++){
    const j=i%ringSize,w=g.weights[i],tz=torso.getZ(j),dx=torso.getX(j)*width-base.getX(topStart+j),dy=hips-tz*sin-base.getY(topStart+j),dz=forward+tz*cos-base.getZ(topStart+j);
    const t=Math.max(0,Math.min(1,(base.getY(i)+w*(hips-top)-bottom)/(hips-bottom))),u=Math.max(0,Math.min(1,t<kneeT?t/kneeT:(t-kneeT)/(1-kneeT))),ease=u*u*(3-2*u),center=t<kneeT?knee.z*ease:knee.z+(forward-knee.z)*ease;
    p.setXYZ(i,base.getX(i)+w*dx,base.getY(i)+w*dy,base.getZ(i)+w*dz+center-w*forward);
  }
  p.needsUpdate=true;g.geometry.computeVertexNormals();
  const normals=g.geometry.getAttribute('normal'),torsoNormals=torsoCloth.getAttribute('normal');
  for(let j=0;j<ringSize;j++){const x=torsoNormals.getX(j)/width,y=torsoNormals.getY(j)*cos-torsoNormals.getZ(j)*sin,z=torsoNormals.getY(j)*sin+torsoNormals.getZ(j)*cos,length=Math.hypot(x,y,z);normals.setXYZ(topStart+j,x/length,y/length,z/length);}
  normals.needsUpdate=true;return true;
}

/** Two fixed-length leg segments bend at the knees while both feet stay planted. */
export function serviceKnee(hips:number,forward:number,out:{y:number;z:number}){
  const dy=hips-.065,dz=forward,d=Math.hypot(dy,dz),thigh=.395,shin=.385;
  const a=(thigh*thigh-shin*shin+d*d)/(2*d),h=Math.sqrt(Math.max(0,thigh*thigh-a*a));
  out.y=hips-a*dy/d-h*dz/d;out.z=forward-a*dz/d+h*dy/d;return out;
}
