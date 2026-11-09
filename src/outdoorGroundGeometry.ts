import * as THREE from 'three';
import {pondEdge} from './pondGeometry';
import {bambooZoneBounds} from './courtyardZoneData';
export const bambooGrove={x:-38,z:12};
const [west,east,north,south]=bambooZoneBounds;
const bambooOutline=[new THREE.Vector2(west,-south),new THREE.Vector2(east,-south),new THREE.Vector2(east,-north),new THREE.Vector2(west,-north)];
function ground(width:number,depth:number,z:number,bamboo=false){
 const shape=new THREE.Shape([new THREE.Vector2(-width/2,-depth/2-z),new THREE.Vector2(width/2,-depth/2-z),new THREE.Vector2(width/2,depth/2-z),new THREE.Vector2(-width/2,depth/2-z)]);
 shape.holes.push(new THREE.Path(pondEdge));
 if(bamboo)shape.holes.push(new THREE.Path(bambooOutline));
 return new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2);
}
export const outerGroundGeometry=ground(350,350,0),courtyardGroundGeometry=ground(124,132,-2,true);
export const bambooGroundGeometry=new THREE.ShapeGeometry(new THREE.Shape(bambooOutline)).rotateX(-Math.PI/2);
