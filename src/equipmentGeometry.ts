import * as T from 'three';
import {batchGeometry,coloredGeometry} from './geometryBatch';
import {souvenirProduct} from './souvenirGeometry';
import type {SouvenirId} from './souvenirData';
const cache=new Map<SouvenirId,T.BufferGeometry>();
export const equipmentMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.57,metalness:.16});
export function equipmentGeometry(id:SouvenirId){
 const cached=cache.get(id);if(cached)return cached;
 const parts:T.BufferGeometry[]=[],sphere=new T.SphereGeometry(1,8,5),box=new T.BoxGeometry(),ring=new T.TorusGeometry(1,.06,4,20);
 const add=(source:T.BufferGeometry,color:string,p:[number,number,number],scale:[number,number,number],rotation:[number,number,number]=[0,0,0])=>parts.push(coloredGeometry(source,color,p,scale,rotation));
 if(id==='buddha'||id==='sutra'){
  const product=souvenirProduct(id),scale=id==='buddha'?.25:.28;
  for(const source of Object.values(product.geometry)){const geometry=source.clone();geometry.deleteAttribute('uv');parts.push(geometry.scale(scale,scale,scale).translate(0,.012,0));}
 }else if(id==='mala'||id==='bracelet'){
  const mala=id==='mala',radius=mala?.075:.044,count=mala?24:16;
  for(let i=0;i<count;i++){const angle=i/count*Math.PI*2;add(sphere,i===0?'#ba9a61':'#775033',[Math.cos(angle)*radius,mala?.085+Math.sin(angle)*radius:Math.sin(angle)*radius,0],[radius*.14,radius*.14,radius*.14]);}
  add(ring,'#5f4430',[0,mala?.085:0,0],[radius,radius,radius]);
  if(mala){add(sphere,'#b69861',[0,.003,0],[.014,.018,.014]);for(const x of [-.009,0,.009])add(box,'#a86e4f',[x,-.033,0],[.003,.043,.003]);}
 }else{
  const points=[[-.12,.13,.08],[-.105,.02,.19],[0,-.085,.222],[.105,.02,.19],[.12,.13,.08],[0,.145,-.085],[-.12,.13,.08]].map(p=>new T.Vector3(...p));
  const cord=new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.004,4,false);add(cord,id==='pendant'?'#766044':'#b29966',[0,0,0],[1,1,1]);cord.dispose();
  add(sphere,'#b49a65',[0,-.085,.226],[.035,.049,.009]);add(sphere,id==='pendant'?'#759685':'#d2c39c',[0,-.085,.234],[.028,.041,.008]);
  if(id==='pendant'){add(sphere,'#e6dab6',[0,-.076,.244],[.008,.009,.003]);add(sphere,'#e6dab6',[0,-.096,.245],[.015,.014,.003]);}
  else for(const side of [-1,0,1])add(sphere,'#bb9e64',[side*.009,-.085,.246],[.008,.020,.003],[0,0,-side*.55]);
 }
 sphere.dispose();box.dispose();ring.dispose();const geometry=batchGeometry(parts);cache.set(id,geometry);return geometry;
}
