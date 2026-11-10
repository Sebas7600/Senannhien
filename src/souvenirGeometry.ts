import * as T from 'three';
import {batchGeometry,coloredGeometry} from './geometryBatch';
import {STALL,STALL_PLAQUE,COUNTER_LAYOUT,souvenirCatalog,souvenirStalls,SOUVENIR_ATLAS,type SouvenirId,type SouvenirStall} from './souvenirData';
type Point=[number,number,number];
export type Bead={p:Point;size:number;color:string};
type Kind='wood'|'cloth'|'metal'|'goods'|'paper'|'glow';
const box=new T.BoxGeometry(),sphere=new T.SphereGeometry(1,6,4),cylinder=new T.CylinderGeometry(1,1,1,6,1,true),torus=new T.TorusGeometry(1,.045,3,8);
const closedBase=new T.CylinderGeometry(1,1,1,10);
const fruitSphere=new T.SphereGeometry(1,9,6);
const bananaGeometry=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.14,.06,0),new T.Vector3(-.07,-.025,0),new T.Vector3(.08,-.045,0),new T.Vector3(.17,.035,0)]),6,.038,5,false);
const coilGeometry=new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:65},(_,i)=>{const angle=i/64*Math.PI*7.2,radius=.025+i/64*.18;return new T.Vector3(Math.cos(angle)*radius,0,Math.sin(angle)*radius);})),64,.009,4,false);
const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.quadraticCurveTo(.09,.11,0,.24);leafShape.quadraticCurveTo(-.09,.11,0,0);
const fruitLeaf=new T.ShapeGeometry(leafShape,3).rotateX(-Math.PI/2);
const sideGableShape=new T.Shape();sideGableShape.moveTo(-1.92,0);sideGableShape.lineTo(0,.70);sideGableShape.lineTo(1.92,0);sideGableShape.closePath();
const sideGable=new T.ExtrudeGeometry(sideGableShape,{depth:.06,bevelEnabled:false,steps:1}).rotateY(Math.PI/2);
/** Static meshes are merged once per plot; beads are instanced. No product owns an animation loop. */
export function buildSouvenirPlot(stalls:SouvenirStall[],productOnly=false){
 const buckets:Record<Kind,T.BufferGeometry[]>={wood:[],cloth:[],metal:[],goods:[],paper:[],glow:[]},beads:Bead[]=[],signs:{stall:SouvenirStall;p:Point;width:number;height:number;rotation:number;index:number;pitch?:number}[]=[];
 let active:SouvenirStall,localTransform:T.Matrix4|null=null;
 const counterJewelry:{id:SouvenirId;bounds:T.Box3}[]=[];
 function world(p:Point):Point{const c=Math.cos(active.rotation),s=Math.sin(active.rotation);return [active.x+c*p[0]+s*p[2],p[1],active.z-s*p[0]+c*p[2]];}
 function piece(kind:Kind,source:T.BufferGeometry,color:string,p:Point,scale:Point=[1,1,1],r:Point=[0,0,0]){const g=coloredGeometry(source,color,p,scale,r);if(localTransform)g.applyMatrix4(localTransform);g.rotateY(active.rotation);g.translate(active.x,0,active.z);buckets[kind].push(g);}
 const cube=(kind:Kind,color:string,p:Point,scale:Point,r:Point=[0,0,0])=>piece(kind,box,color,p,scale,r);
 const ball=(kind:Kind,color:string,p:Point,scale:Point)=>piece(kind,sphere,color,p,scale);
 function rod(kind:Kind,color:string,a:Point,b:Point,r=.012){const av=new T.Vector3(...a),bv=new T.Vector3(...b),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),bv.clone().sub(av).normalize()),e=new T.Euler().setFromQuaternion(q);piece(kind,cylinder,color,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[r,av.distanceTo(bv),r],[e.x,e.y,e.z]);}
 function ring(p:Point,radius:number,count:number,color:string,hanging=false){
  for(let k=0;k<count;k++){const a=k/count*Math.PI*2;beads.push({p:world([p[0]+Math.sin(a)*radius*(hanging?.66:1),p[1]+(hanging?Math.cos(a)*radius:0),p[2]+(hanging?0:Math.cos(a)*radius)]),size:radius*(k===0?.13:hanging?.075:.15),color:k===0?'#c3a667':color});}
  piece('goods',torus,'#594236',p,[radius*(hanging?.66:1),radius,radius],hanging?[0,0,0]:[Math.PI/2,0,0]);
  if(hanging){const y=p[1]-radius;ball('goods',color,[p[0],y-.035,p[2]],[.045,.065,.045]);for(let j=0;j<4;j++)rod('goods','#9e604b',[p[0]+j*.008-.012,y-.09,p[2]],[p[0]+j*.014-.02,y-.23,p[2]],.006);}
 }
 function tray(x:number,z:number,w=1.14,d=.67){cube('wood','#b19269',[x,1.015,z],[w,.055,d]);cube('cloth','#253a36',[x,1.05,z],[w-.09,.018,d-.09]);for(const side of [-1,1])cube('wood','#c1a377',[x+side*w/2,1.075,z],[.035,.09,d]);}
 function buddha(x:number,y:number,z:number,size:number,color:string){
  const part=(p:Point,s:Point)=>ball('goods',color,[x+p[0]*size,y+p[1]*size,z+p[2]*size],s.map(v=>v*size) as Point);
  piece('goods',closedBase,color,[x,y+.065*size,z],[.29*size,.13*size,.26*size]);
  for(let j=0;j<10;j++){const a=j/10*Math.PI*2;part([Math.cos(a)*.23,.14,Math.sin(a)*.21],[.09,.075,.07]);}
  part([0,.40,0],[.17,.25,.115]);part([-.16,.23,.065],[.20,.095,.16]);part([.16,.23,.065],[.20,.095,.16]);
  part([0,.71,0],[.105,.13,.10]);part([0,.84,-.012],[.073,.054,.071]);part([0,.90,-.012],[.035,.04,.035]);
  for(const side of [-1,1]){part([side*.11,.70,0],[.028,.069,.034]);rod('goods',color,[x+side*.13*size,y+.57*size,z],[x+side*.18*size,y+.36*size,z+.12*size],.046*size);}
  part([0,.71,.099],[.017,.034,.026]);part([0,.30,.14],[.10,.035,.065]);
  for(const side of [-1,1])rod('goods','#665035',[x+side*.025*size,y+.745*size,z+.095*size],[x+side*.067*size,y+.739*size,z+.095*size],.006*size);
  rod('goods','#95774e',[x-.11*size,y+.54*size,z+.083*size],[x+.05*size,y+.34*size,z+.11*size],.008*size);
 }
 function pendant(x:number,y:number,z:number,color:string){ball('metal','#bd9b5c',[x,y,z],[.115,.16,.032]);ball('goods',color,[x,y,z+.028],[.097,.14,.027]);
  if(active.id==='necklace'){
   for(const side of [-1,0,1])piece('metal',sphere,'#e2cf98',[x+side*.034,y-.015+Math.abs(side)*.012,z+.057],[.029,.068,.013],[0,0,-side*.55]);
  }else buddha(x,y-.10,z+.047,.19,'#ddcea1');
  piece('metal',torus,'#c7a464',[x,y+.18,z],[.026,.026,.026]);}
 function flatPendant(x:number,z:number,color:string){
  const start=Object.fromEntries(Object.entries(buckets).map(([kind,items])=>[kind,items.length])),bounds=new T.Box3();
  // Lay the ornament face-up, then seat its actual tessellated back on the fabric.
  localTransform=new T.Matrix4().makeRotationX(-Math.PI/2).scale(new T.Vector3(1,1,.55)).setPosition(x,COUNTER_LAYOUT.traySurfaceY+.033,z);
  try{pendant(0,0,0,color);}finally{localTransform=null;}
  const parts=Object.entries(buckets).flatMap(([kind,items])=>items.slice(start[kind]));
  for(const geometry of parts){geometry.computeBoundingBox();bounds.union(geometry.boundingBox!);}
  const contact=new T.Vector3(0,COUNTER_LAYOUT.traySurfaceY+.0005-bounds.min.y,0);
  for(const geometry of parts)geometry.translate(0,contact.y,0);
  bounds.translate(contact);
  counterJewelry.push({id:active.id,bounds});
 }
 function basket(p:Point,w=.86,d=.68){
  cube('wood','#ac895b',[p[0],p[1]+.025,p[2]],[w,.05,d]);
  for(const side of [-1,1]){
   for(let row=0;row<3;row++){
    const y=p[1]+.055+row*.045;
    cube('wood',row%2?'#b89b6a':'#c3a671',[p[0],y,p[2]+side*d/2],[w+.035,.024,.025]);
    cube('wood','#a58c5e',[p[0]+side*w/2,y,p[2]],[.025,.024,d]);
   }
   for(let j=0;j<6;j++)cube('wood','#93784e',[p[0]-w*.43+j*w*.17,p[1]+.10,p[2]+side*d/2],[.018,.17,.018]);
  }
 }
 function fruit(kind:number,p:Point,scale=1,seed=0){
  const [x,y,z]=p,r=.115*scale;
  if(kind===2){
   for(let j=0;j<5;j++){
    piece('goods',bananaGeometry,j%2?'#d9bc52':'#d7c56a',[x+((j%3)-1)*.035*scale,y+Math.floor(j/3)*.055*scale,z+(j%3)*.06*scale],[scale,scale,scale],[.12,j*.13-.25,0]);
   }
   rod('goods','#687747',[x-.16*scale,y+.07*scale,z],[x-.19*scale,y+.12*scale,z],.025*scale);return;
  }
  const color=kind===0?(seed%2?'#d9a249':'#e1b15b'):kind===1?(seed%3===0?'#8f9e56':'#b65a43'):'#bc6b7b';
  piece('goods',fruitSphere,color,[x,y+r*.80,z],[r,kind===3?r*1.27:r*.91,r*(kind===1?.94:1)]);
  rod('goods','#655139',[x,y+r*1.45,z],[x+.015*scale,y+r*1.9,z],.012*scale);
  if(kind===3)for(let j=0;j<7;j++){
   const a=j/7*Math.PI*2;piece('goods',fruitLeaf,'#899957',[x+Math.cos(a)*r*.75,y+r*.75,z+Math.sin(a)*r*.75],[scale*.40,scale*.40,scale*.40],[Math.cos(a)*.65,-a,Math.sin(a)*.65]);
  }else piece('goods',fruitLeaf,kind===0?'#657b46':'#708650',[x,y+r*1.65,z],[scale*.48,scale*.48,scale*.48],[.25,seed*.7,0]);
 }
 function fruitBasket(kind:number,p:Point,small=false){
  basket(p,small?.62:.96,small?.54:.68);
  if(kind===2){for(let j=0;j<(small?1:2);j++)fruit(kind,[p[0]-.12+j*.22,p[1]+.12,p[2]-.05],.88,j);return;}
  for(let j=0;j<(small?4:6);j++)fruit(kind,[p[0]+(j%3-1)*.235,p[1]+.07,p[2]+(j<3?-.14:.13)],.92,j);
  if(!small)for(let j=0;j<2;j++)fruit(kind,[p[0]-.12+j*.24,p[1]+.24,p[2]],.9,j+7);
 }
 function incenseBundle(p:Point,scale=1,lean=0){
  for(let j=0;j<13;j++){
   const a=j*2.399,r=j===0?0:.032*scale,dx=Math.sin(a)*r,dz=Math.cos(a)*r;
   const base:Point=[p[0]+dx,p[1],p[2]+dz],joint:Point=[base[0]+lean*.18*scale,p[1]+.18*scale,base[2]],top:Point=[base[0]+lean*.75*scale,p[1]+.75*scale,base[2]];
   rod('goods',j%2?'#a64d39':'#b55b45',base,joint,.005*scale);rod('goods',j%3?'#b49b72':'#9f845f',joint,top,.005*scale);
  }
  cube('paper','#b24e3b',[p[0]+lean*.32*scale,p[1]+.32*scale,p[2]],[.105*scale,.15*scale,.10*scale]);
  cube('metal','#d0b074',[p[0]+lean*.32*scale,p[1]+.32*scale,p[2]+.053*scale],[.065*scale,.045*scale,.007*scale]);
 }
 function incenseHolder(p:Point){
  piece('goods',closedBase,'#8c6947',[p[0],p[1]+.135,p[2]],[.145,.27,.145]);
  piece('metal',torus,'#b49a64',[p[0],p[1]+.275,p[2]],[.14,.14,.14],[Math.PI/2,0,0]);
  for(const side of [-1,0,1])incenseBundle([p[0]+side*.06,p[1]+.10,p[2]],.78,side*.16);
 }
 for(const stall of stalls){active=stall;
  const timber='#866449',dark='#4e352a',light='#b1936a';
  if(productOnly){
   if(stall.id==='mala')ring([0,.59,0],.34,27,'#835438',true);
   else if(stall.id==='bracelet')ring([0,.06,0],.27,18,'#8b6247');
   else if(stall.id==='buddha')buddha(0,0,0,1,'#b39a60');
   else if(stall.id==='fruit'){fruitBasket(0,[0,0,0],true);fruit(1,[.13,.17,.04],.9);}
   else if(stall.id==='incensePack'){incenseBundle([0,0,0],1.15);piece('paper',closedBase,'#dec78d',[0,.35,0],[.067,.25,.067]);}
   else if(stall.id==='sutra'){
    cube('paper','#e0d1ad',[0,.06,0],[.66,.09,.90]);
    for(const side of [-1,1])cube('cloth','#48636b',[0,.06+side*.05,0],[.70,.013,.95]);
    signs.push({stall,p:[0,.118,0],width:.64,height:.87,rotation:0,index:SOUVENIR_ATLAS.bookFlat,pitch:-Math.PI/2});
    for(let j=0;j<6;j++)rod('goods','#cab787',[-.34,.07,-.36+j*.14],[-.30,.12,-.36+j*.14],.007);
   }else{
    for(let k=0;k<24;k++){const a=k/24*Math.PI,b=(k+1)/24*Math.PI;rod('goods',stall.id==='necklace'?'#b79b63':'#654634',[Math.cos(a)*.22,.78-Math.sin(a)*.48,0],[Math.cos(b)*.22,.78-Math.sin(b)*.48,0],.008);}
    pendant(0,.22,.017,stall.id==='necklace'?'#d4c494':'#719582');
   }
   continue;
  }
  // Flush stepping stones do not introduce a curb or block the visitor aisle.
  cube('goods','#aaa190',[0,.08,.15],[5.7,.035,4.75]);
  for(let j=0;j<18;j++)cube('wood',j%3===0?'#8b6e50':'#a38662',[-2.55+j*.30,.115,0],[.29,.055,3.7]);
  for(const x of [-2.5,2.5])for(const z of [-1.55,1.55]){
   cube('metal','#51463b',[x,.22,z],[.22,.22,.22]);cube('wood',dark,[x,1.63,z],[.145,2.92,.145]);
   for(const zz of [-1,1])rod('wood',timber,[x,2.58,z],[x,3.06,z-zz*.47],.047);
  }
  cube('wood',dark,[0,2.98,1.62],[5.6,.19,.18]);cube('wood',dark,[0,2.98,-1.62],[5.6,.19,.18]);
  // Two sloping roof leaves, a raised ridge and edge binding echo portable festival stalls.
  for(const side of [-1,1]){
   cube('cloth',stall.cloth,[0,3.31,side*.94],[5.95,.07,2.22],[side*.34,0,0]);
   cube('wood',dark,[0,3.01,side*1.99],[6.04,.09,.095]);
   cube('metal','#c1a16b',[0,3.08,side*1.97],[5.96,.025,.025]);
   for(const x of [-2.8,2.8])rod('wood',light,[x,3.70,0],[x,3.0,side*2.04],.045);
  }
  cube('wood',dark,[0,3.71,0],[6.1,.10,.115]);
  // Closed side walls, slat detailing and solid gable ends remove the view-through gaps.
  for(const side of [-1,1]){
   cube('wood','#826145',[side*2.50,1.515,0],[.09,2.75,3.2]);
   for(let j=0;j<13;j++)cube('wood',j%3?'#a18460':'#91714e',[side*2.55,1.515,-1.48+j*.247],[.022,2.68,.024]);
   for(const y of [.30,1.05,2.63])cube('wood',dark,[side*2.57,y,0],[.038,.075,3.24]);
   cube('wood',dark,[side*2.5,2.97,0],[.13,.18,3.84]);
   piece('wood',sideGable,'#806047',[side*2.5-.03,3.02,0]);
  }
  // Back slat wall, shelves, shelf brackets and hinged lower cabinet fronts.
  cube('wood','#8b694d',[0,1.42,-1.56],[5,.12+2.25,.09]);
  for(let j=0;j<19;j++)cube('wood',j%3===0?'#745038':'#a3825d',[-2.37+j*.263,1.43,-1.495],[.025,2.15,.022]);
  for(const y of [.99,1.69,2.25]){cube('wood',light,[0,y,-1.11],[4.7,.08,.72]);for(const x of [-1.82,0,1.82])rod('wood',dark,[x,y-.23,-1.5],[x,y-.04,-.84],.024);}
  cube('wood',timber,[0,.55,1.17],[4.94,.90,.70]);cube('wood',light,[0,.99,1.22],[5.15,.105,.94]);
  for(let i=0;i<5;i++){cube('wood',i%2?'#71513e':'#806048',[-2+i,.54,1.533],[.94,.70,.023]);cube('metal','#b49258',[-2+i,.71,1.557],[.13,.025,.022]);}
  cube('cloth',stall.cloth,[0,1.053,1.24],[4.56,.014,.69]);
  // Split noren panels: visitor view remains open under the valance.
  for(let i=0;i<5;i++){
   cube('cloth',stall.cloth,[-2.14+i*1.07,2.73,1.76],[1.025,.44,.024]);
   cube('metal','#cdb884',[-2.14+i*1.07,2.54,1.78],[.98,.016,.012]);
   for(let j=0;j<3;j++)ball('metal','#d8c58f',[-2.14+i*1.07+(j-1)*.035,2.74+Math.abs(j-1)*.025,1.78],[.025,.053,.008]);
  }
  // Paper lanterns, without per-stall extra real-time lights.
  for(const x of [-2.74,2.74]){
   rod('metal','#40352a',[x,2.96,1.64],[x,2.65,1.86],.012);
   ball('glow','#ffe1a1',[x,2.40,1.86],[.21,.29,.21]);
   for(const y of [2.15,2.65])piece('wood',cylinder,dark,[x,y,1.86],[.14,.055,.14]);
   for(let j=0;j<6;j++)piece('wood',torus,'#a99064',[x,2.2+j*.08,1.86],[.20,.20,.20],[Math.PI/2,0,0]);
  }
  // Mount ahead of the roof fascia: the old recessed label was partly hidden by it.
  const plaque=STALL_PLAQUE;
  cube('wood','#392c22',[0,plaque.y,plaque.z-.044],[plaque.width+.025,plaque.height+.025,.08]);
  for(const side of [-1,1]){
   rod('wood',dark,[side*.78,3.0,1.63],[side*.78,plaque.y,plaque.z-.07],.025);
  }
  signs.push({stall,p:world([0,plaque.y,plaque.z]),width:plaque.width,height:plaque.height,rotation:stall.rotation,index:souvenirCatalog.findIndex(item=>item.id===stall.id)});
  // Small counter label, packing boxes and folded wrapping paper.
  cube('wood',light,[2.05,1.18,1.20],[.50,.22,.12],[.10,0,0]);
  for(let j=0;j<3;j++)cube('paper',j%2?'#c8af86':'#ddcbaa',[1.8+j*.16,1.05+j*.08,-.12],[.39,.075,.27]);
  if(stall.id==='mala'){
   for(let j=0;j<7;j++){const x=-1.98+j*.64;rod('metal','#bba16d',[x,2.28,-.96],[x,2.33,-.78],.015);ring([x,1.87,-.78],.34,27,j%2?'#654735':'#a0794c',true);}
   for(let j=0;j<3;j++){const x=COUNTER_LAYOUT.productX[j];tray(x,1.25,.98,.66);ring([x,1.11,1.24],.20,24,j%2?'#ac8b53':'#69452e');}
  }else if(stall.id==='buddha'){
   for(let j=0;j<5;j++){const x=-1.83+j*.91;cube('wood',dark,[x,1.76,-1.06],[.70,.09,.53]);buddha(x,1.81,-1.06,.62,j%2?'#d6c9a5':'#a99052');}
   for(let j=0;j<3;j++){const x=COUNTER_LAYOUT.productX[j];cube('wood',dark,[x,1.10,1.14],[.82,.11,.66]);buddha(x,1.16,1.14,.65,j===1?'#dfd2ad':'#a88a4b');}
  }else if(stall.id==='bracelet'){
   for(let j=0;j<6;j++){const x=j<3?COUNTER_LAYOUT.productX[j]:-1.65+j%3*1.62,z=j<3?1.23:-1.04,y=j<3?1.10:1.81;if(j<3)tray(x,z,1.04,.67);for(const side of [-1,1])ring([x+side*(j<3?.23:.31),y,z],j<3?.17:.20,18,['#825033','#709183','#bcaa80'][j%4]);}
  }else if(stall.id==='sutra'){
   for(let shelf=0;shelf<2;shelf++)for(let j=0;j<9;j++){
    const x=-2+j*.49,y=1.05+shelf*.70,c=['#7f4239','#3b5964','#c3ab76'][j%3];
    cube('paper','#e1d2ad',[x,y+.24,-1.05],[.36,.47,.13]);
    for(const side of [-1,1])cube('cloth',c,[x,y+.24,-1.05+side*.083],[.40,.51,.023]);
    cube('metal','#bc9e60',[x,y+.30,-.957],[.027,.23,.005]);
    for(const side of [-1,1])cube('metal','#c9b37d',[x+side*.15,y+.24,-.95],[.01,.44,.008]);
    signs.push({stall,p:world([x,y+.24,-.947]),width:.28,height:.40,rotation:stall.rotation,index:SOUVENIR_ATLAS.bookUpright});
   }
   for(let j=0;j<6;j++){const x=COUNTER_LAYOUT.productX[j%3],y=1.10+Math.floor(j/3)*.105;cube('paper','#ddcfab',[x,y,1.19],[.90,.078,.56]);for(const side of [-1,1])cube('cloth',['#415d65','#854c40','#baa277'][j%3],[x,y+side*.044,1.19],[.95,.012,.61]);signs.push({stall,p:world([x,y+.052,1.19]),width:.82,height:.49,rotation:stall.rotation,index:SOUVENIR_ATLAS.bookFlat,pitch:-Math.PI/2});}
  }else if(stall.id==='fruit'){
   for(let j=0;j<4;j++)fruitBasket(j,[COUNTER_LAYOUT.fruitX[j],1.065,1.23],true);
   for(let shelf=0;shelf<2;shelf++)for(let j=0;j<4;j++){
    const x=-1.83+j*1.22,y=1.74+shelf*.56;
    if(shelf===0&&j<2){
     for(let k=0;k<2;k++){cube('paper',j?'#baaa79':'#a99166',[x+(k-.5)*.24,y+.16,-1.06],[.22,.32,.16]);cube('cloth',j?'#62764d':'#587b7a',[x+(k-.5)*.24,y+.17,-.972],[.14,.14,.008]);}
    }else if(shelf===0&&j===2){
     for(const side of [-1,0,1]){rod('goods','#62764d',[x,y,-1.07],[x+side*.14,y+.43,-1.07],.008);ball('goods',side?'#d1a6af':'#ead9ba',[x+side*.14,y+.43,-1.07],[.09,.07,.07]);}
     cube('paper','#d8c39d',[x,y+.12,-1.07],[.24,.24,.15]);
    }else fruitBasket((j+shelf)%4,[x,y,-1.07],true);
   }
   // A small folded paper bag and tied produce baskets, all on the counter.
   for(let j=0;j<3;j++){cube('paper','#d8c39d',[1.88+j*.08,1.18,-.11],[.30,.32,.18],[0,j*.12,0]);rod('wood','#937a53',[1.78+j*.08,1.34,-.11],[1.98+j*.08,1.34,-.11],.012);}
  }else if(stall.id==='incensePack'){
   for(const x of COUNTER_LAYOUT.productX)incenseHolder([x,1.06,1.20]);
   for(let shelf=0;shelf<2;shelf++)for(let j=0;j<7;j++){
    const x=-1.98+j*.66,y=1.75+shelf*.56;
    if(shelf===1&&j<2){for(const side of [-1,0,1])piece('goods',closedBase,'#e4d6b8',[x+side*.12,y+.12,-1.05],[.045,.24,.045]);}
    else if(shelf===1&&j===2){for(let k=0;k<5;k++){const a=k/5*Math.PI*2;ball('paper','#c99e8e',[x+Math.sin(a)*.13,y+.065,-1.05+Math.cos(a)*.12],[.08,.06,.065]);}piece('goods',closedBase,'#e4d6b8',[x,y+.07,-1.05],[.04,.06,.04]);}
    else if(j%3===0)incenseBundle([x,y,-1.05],.65);
    else{cube('paper',j%2?'#b66c48':'#d1b67d',[x,y+.15,-1.09],[.44,.30,.32]);cube('paper','#854b37',[x,y+.15,-.923],[.27,.17,.012]);cube('metal','#c7ad6f',[x,y+.15,-.913],[.045,.10,.008]);}
   }
   for(const x of [.09,1.25]){
    piece('goods',closedBase,'#95683e',[x,1.08,1.36],[.28,.025,.27]);
    for(let j=0;j<2;j++)piece('goods',coilGeometry,'#b99c68',[x,1.11+j*.027,1.36]);
   }
  }else{
   for(let j=0;j<7;j++){
    const x=-1.99+j*.66;cube('wood',dark,[x,1.93,-1.05],[.47,.69,.055]);
    // Soft U-shape cords attached to a row of display hooks.
    for(let k=0;k<14;k++){const a=k/14*Math.PI,b=(k+1)/14*Math.PI;rod('goods',stall.id==='necklace'?'#c1a56a':'#654634',[x+Math.cos(a)*.16,2.18-Math.sin(a)*.40,-.99],[x+Math.cos(b)*.16,2.18-Math.sin(b)*.40,-.99],.009);}
    pendant(x,1.74,-.94,j%2?'#6f9581':'#c5b78c');
   }
   for(let j=0;j<3;j++){
    const x=COUNTER_LAYOUT.productX[j];tray(x,1.22,1.02,.68);
    if(stall.id==='necklace'){
     for(let k=0;k<24;k++){const a=k/24*Math.PI*2,b=(k+1)/24*Math.PI*2;rod('goods','#bba16b',[x+Math.sin(a)*.18,1.068,1.04+Math.cos(a)*.14],[x+Math.sin(b)*.18,1.068,1.04+Math.cos(b)*.14],.006);}
     flatPendant(x,1.35,j%2?'#7a9b87':'#d4c494');
    }else flatPendant(x,1.23,j%2?'#6f9581':'#d9cba4');
   }
  }
 }
 const geometry=Object.fromEntries(Object.entries(buckets).filter(([,parts])=>parts.length).map(([key,parts])=>[key,batchGeometry(parts)])) as Record<Kind,T.BufferGeometry>;
 // Project grain from the local board axes; all timber shares one small repeating texture.
 for(const key of ['wood','cloth','paper'] as const){const g=geometry[key];if(!g)continue;const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){const top=Math.abs(n.getY(i))>.7;uv[i*2]=(top?p.getX(i):Math.abs(n.getX(i))>.7?p.getZ(i):p.getX(i))*.7;uv[i*2+1]=(top?p.getZ(i):p.getY(i))*.7;}g.setAttribute('uv',new T.BufferAttribute(uv,2));}
 return {geometry,beads,signs,counterJewelry};
}

const productCache=new Map<SouvenirId,ReturnType<typeof buildSouvenirPlot>>();
export function souvenirProduct(id:SouvenirId){
 let product=productCache.get(id);
 if(!product){product=buildSouvenirPlot([{...souvenirStalls.find(stall=>stall.id===id)!,x:0,z:0,rotation:0}],true);productCache.set(id,product);}
 return product;
}
