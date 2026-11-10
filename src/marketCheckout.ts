import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {batchGeometry,coloredGeometry} from './geometryBatch';
import {COUNTER_LAYOUT,souvenirStalls,stallPoint,type SouvenirStall} from './souvenirData';

// Same URL order as ReceptionDesk so drei reuses its cached pair of textures.
export const CHECKOUT_SCREEN_IMAGES={staff:'/art/pos/receptionist-screen.png',guest:'/art/pos/customer-checkin-screen.png'} as const;
export const CHECKOUT_SCREEN={width:.73,height:.40,y:.468,z:.143} as const;
export function checkoutScreenStall(faceIndex:number,count=souvenirStalls.length){
 return Number.isInteger(faceIndex)&&faceIndex>=0&&faceIndex<count*4?Math.floor(faceIndex/2)%count:-1;
}
export function checkoutPose(stall:SouvenirStall){
 const layout=COUNTER_LAYOUT.terminal,[x,z]=stallPoint(stall,layout.x,layout.z);
 return new T.Matrix4().compose(new T.Vector3(x,layout.y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),stall.rotation),new T.Vector3().setScalar(layout.scale));
}

/** One shared shell for eight terminals; no skeleton, lights or frame updates. */
export function buildCheckoutShell(){
 const parts:T.BufferGeometry[]=[],box=new T.BoxGeometry(),round=new RoundedBoxGeometry(1,1,1,1,.04);
 function piece(color:string,p:[number,number,number],s:[number,number,number],r:[number,number,number]=[0,0,0],rounded=false){parts.push(coloredGeometry(rounded?round:box,color,p,s,r));}
 piece('#c4c9c6',[0,.009,0],[.51,.018,.34]);
 piece('#e1e5de',[0,.044,0],[.59,.068,.40],[0,0,0],true);
 piece('#c1c9c2',[0,.236,-.008],[.17,.35,.14],[-.13,0,0],true);
 piece('#e3e6df',[0,.374,0],[.30,.075,.25],[0,0,0],true);
 for(const side of [-1,1]){
  piece('#e0e4de',[0,CHECKOUT_SCREEN.y,side*.10],[.83,.50,.075],[0,0,0],true);
  piece('#303e45',[0,CHECKOUT_SCREEN.y,side*.139],[.756,.426,.006]);
  // Thin lower bezel, camera aperture and tiny status LED.
  piece('#b7c1b8',[0,.242,side*.142],[.20,.009,.003]);
  piece('#434c49',[.32,.69,side*.141],[.018,.007,.004]);
  piece('#85aa8b',[-.34,.69,side*.141],[.011,.007,.004]);
 }
 // Vented spine, reader and a recessed slot beside the base.
 for(let i=0;i<5;i++)piece('#a7b2aa',[.091,.17+i*.023,-.008],[.004,.007,.075]);
 piece('#cbd3ca',[.37,.082,.11],[.15,.13,.20],[-.18,0,0],true);
 piece('#45564e',[.37,.151,.115],[.104,.004,.093],[-.18,0,0]);
 piece('#65766a',[.37,.115,.207],[.095,.009,.006]);
 box.dispose();round.dispose();return batchGeometry(parts);
}

/** Batch all guest faces, then all staff faces: two texture draws for all eight stalls. */
export function buildCheckoutScreens(stalls:SouvenirStall[]=souvenirStalls){
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 const screen=CHECKOUT_SCREEN,point=new T.Vector3();
 [1,-1].forEach(side=>{
  stalls.forEach(stall=>{
   const matrix=checkoutPose(stall);
   const offset=positions.length/3;
   for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
    point.set(x*screen.width/2*side,screen.y+y*screen.height/2,side*screen.z).applyMatrix4(matrix);positions.push(point.x,point.y,point.z);
   }
   uv.push(0,0,1,0,0,1,1,1);
   indices.push(offset,offset+1,offset+2,offset+2,offset+1,offset+3);
  });
 });
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
 geometry.addGroup(0,stalls.length*6,0);geometry.addGroup(stalls.length*6,stalls.length*6,1);
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
