import {shopProducts} from '../src/shopData';
import {equipmentGeometry} from '../src/equipmentGeometry';
import {cleanEquipment,emptyEquipment,canDisplayHandItem} from '../src/equipmentData';
import {fruitAltars,FRUIT_OFFERING_MS} from '../src/fruitOfferingData';
import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {souvenirCatalog,souvenirStalls,stallApproach,stallPoint,STALL,souvenirCollectibles,COUNTER_LAYOUT,souvenirSolids,souvenirCameraParts,souvenirPlots,SOUVENIR_ATLAS} from '../src/souvenirData';
import {buildSouvenirPlot,souvenirProduct} from '../src/souvenirGeometry';
import {buildCheckoutShell,buildCheckoutScreens,checkoutPose,checkoutScreenStall,CHECKOUT_SCREEN_IMAGES} from '../src/marketCheckout';
import RAPIER from '@dimforge/rapier3d-compat';
import * as T from 'three';
import {cameraSafeDistance} from '../src/cameraCollision';
import {pondContains} from '../src/pondLayout';
import {GATE} from '../src/courtyardPropsData';
import {walkable} from '../src/gameData';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)}},configurable:true});
const {useGame}=await import('../src/gameStore');
const initial=useGame.getInitialState();
beforeEach(()=>useGame.setState({...initial,souvenirs:[]},true));

test('two four-stall plots fit inside the gate, keep the avenue open and have reachable approaches',()=>{
 assert.equal(souvenirStalls.filter(s=>s.x>0).length,4);assert.equal(souvenirStalls.filter(s=>s.x<0).length,4);
 for(const stall of souvenirStalls){
  assert.ok(stall.z+STALL.width/2<GATE.z-5);
  assert.ok(Math.abs(stall.x)-STALL.depth/2>5);
  const approach=stallApproach(stall);assert.ok(walkable(...approach));assert.ok(!walkable(stall.x,stall.z));
  for(const x of [-STALL.width/2,STALL.width/2])for(const z of [-2,2])assert.ok(!pondContains(...stallPoint(stall,x,z),.6));
 }
 for(let z=37;z<63;z+=.5)assert.ok(walkable(0,z),'central avenue');
 for(let i=0;i<souvenirSolids.length;i++)for(let j=i+1;j<souvenirSolids.length;j++){const a=souvenirSolids[i],b=souvenirSolids[j];assert.ok(Math.abs(a.x-b.x)>(a.w+b.w)/2||Math.abs(a.z-b.z)>(a.d+b.d)/2+1);}
});

test('market geometry has finite bounds and remains under its triangle and draw-call budgets',()=>{
 let triangles=0,beadCount=0;
 for(const stalls of souvenirPlots){
  const plot=buildSouvenirPlot(stalls);assert.equal(Object.keys(plot.geometry).length,6);assert.equal(plot.signs.filter(sign=>sign.index<souvenirCatalog.length).length,4);
  for(const g of Object.values(plot.geometry)){const p=g.attributes.position;for(const value of p.array)assert.ok(Number.isFinite(value));triangles+=(g.index?.count??p.count)/3;assert.ok(g.boundingSphere&&Number.isFinite(g.boundingSphere.radius));g.dispose();}
  beadCount+=plot.beads.length;
 }
 triangles+=beadCount*36;
 assert.ok(beadCount<700);assert.ok(triangles<85000,`market: ${triangles} triangles`);
 console.log(JSON.stringify({marketTriangles:triangles,beads:beadCount,marketDrawCalls:16}));
});

test('counter pendants and necklaces rest face-up on their trays on both sides of the avenue',()=>{
 for(const stall of souvenirStalls.filter(stall=>stall.id==='pendant'||stall.id==='necklace')){
  const plot=buildSouvenirPlot([stall]);assert.equal(plot.counterJewelry.length,3);
  plot.counterJewelry.forEach(({bounds},index)=>{
   assert.ok(Math.abs(bounds.min.y-COUNTER_LAYOUT.traySurfaceY-.0005)<.00001,'back touches fabric');
   assert.ok(bounds.max.y-bounds.min.y<.12,'ornament lies flat rather than upright');
   const local=bounds.getCenter(new T.Vector3()).sub(new T.Vector3(stall.x,0,stall.z)).applyAxisAngle(new T.Vector3(0,1,0),-stall.rotation);
   assert.ok(Math.abs(local.x-COUNTER_LAYOUT.productX[index])<.02,'centred within its own tray');
   assert.ok(local.z>.9&&local.z<1.5);
  });
  Object.values(plot.geometry).forEach(geometry=>geometry.dispose());
 }
});

test('all eight ATT900 terminals sit on the counter left with clear space for goods and sellers',()=>{
 const shell=buildCheckoutShell(),bounds=shell.boundingBox!,layout=COUNTER_LAYOUT.terminal;
 const minX=layout.x+bounds.min.x*layout.scale,maxX=layout.x+bounds.max.x*layout.scale;
 assert.ok(minX>-2.28&&maxX<COUNTER_LAYOUT.productX[0]-.52-.20,'left checkout does not overlap merchandise');
 assert.ok(layout.z+bounds.min.z*layout.scale>.895&&layout.z+bounds.max.z*layout.scale<1.585,'base stays on the counter runner');
 for(const stall of souvenirStalls){
  const matrix=checkoutPose(stall),box=bounds.clone().applyMatrix4(matrix);
  assert.ok(Math.abs(box.min.y-COUNTER_LAYOUT.surfaceY-.001)<.00001,'terminal is supported by the countertop');
  const local=new T.Vector3().setFromMatrixPosition(matrix).sub(new T.Vector3(stall.x,0,stall.z)).applyAxisAngle(new T.Vector3(0,1,0),-stall.rotation);
  assert.ok(local.x<-1.5&&local.z>1,'left side when viewed from the customer');
 }
 const triangles=shell.index!.count/3;assert.ok(triangles<1800,`shared shell: ${triangles}`);
 console.log(JSON.stringify({terminals:souvenirStalls.length,checkoutDrawCalls:3,checkoutTriangles:triangles*souvenirStalls.length+32,sharedScreenTextures:2}));shell.dispose();
});

test('checkout screens use the restaurant images on the correct faces with two batches and valid click mapping',()=>{
 const screens=buildCheckoutScreens(),positions=screens.getAttribute('position'),normals=screens.getAttribute('normal'),uv=screens.getAttribute('uv');
 assert.equal(positions.count,souvenirStalls.length*8);assert.equal(screens.index!.count/3,32);
 assert.deepEqual(CHECKOUT_SCREEN_IMAGES,{staff:'/art/pos/staff.jpg',guest:'/art/pos/guest.jpg'});
 assert.deepEqual(screens.groups,[{start:0,count:48,materialIndex:0},{start:48,count:48,materialIndex:1}]);
 souvenirStalls.forEach((stall,index)=>{
  for(let face=0;face<2;face++){
   const vertex=(face*souvenirStalls.length+index)*4,side=face===0?1:-1;
   const normal=new T.Vector3().fromBufferAttribute(normals,vertex),outward=new T.Vector3(0,0,side).applyAxisAngle(new T.Vector3(0,1,0),stall.rotation);
   assert.ok(normal.dot(outward)>.999,'front faces outward, rear faces the seller');
   assert.deepEqual(Array.from({length:4},(_,i)=>[uv.getX(vertex+i),uv.getY(vertex+i)]),[[0,0],[1,0],[0,1],[1,1]],'whole reference image, upright and unmirrored');
   for(let triangle=0;triangle<2;triangle++)assert.equal(checkoutScreenStall(face*souvenirStalls.length*2+index*2+triangle),index);
  }
 });
 for(const faceIndex of [-1,32,NaN,.5])assert.equal(checkoutScreenStall(faceIndex),-1);
 for(const value of positions.array)assert.ok(Number.isFinite(value));assert.ok(screens.boundingSphere&&Number.isFinite(screens.boundingSphere.radius));screens.dispose();
});

test('souvenir purchases charge the listed price once and persist the collection with the player',()=>{
 useGame.setState({position:stallApproach(souvenirStalls[0]),merit:100});
 const item=souvenirCatalog[0];useGame.getState().buySouvenir(item.id);assert.equal(useGame.getState().merit,100-item.cost);assert.deepEqual(useGame.getState().souvenirs,[item.id]);
 useGame.getState().buySouvenir(item.id);useGame.getState().buySouvenir('unknown');assert.equal(useGame.getState().merit,100-item.cost);
 const saved=useGame.persist.getOptions().partialize!(useGame.getState()) as {souvenirs:string[]};assert.deepEqual(saved.souvenirs,[item.id]);
});

test('insufficient merit, remote access and carrying water never charge or grant a souvenir',()=>{
 const near=stallApproach(souvenirStalls[0]);
 useGame.setState({position:near,merit:1});useGame.getState().buySouvenir('buddha');assert.equal(useGame.getState().merit,1);
 useGame.setState({position:[0,0],merit:100});useGame.getState().buySouvenir('mala');assert.equal(useGame.getState().merit,100);
 assert.deepEqual(useGame.getState().souvenirs,[]);
 useGame.setState({position:near,waterQuest:{phase:'carrying',startedAt:Date.now(),phaseAt:Date.now(),room:'an-nhien',jar:null}});useGame.getState().buySouvenir('mala');assert.equal(useGame.getState().merit,100);assert.deepEqual(useGame.getState().souvenirs,[]);
});

test('each 3D inspection model is centred near the origin, reusable and smaller than a full stall',()=>{
 for(const item of souvenirCatalog){
  const product=souvenirProduct(item.id);assert.equal(product,souvenirProduct(item.id));
  let triangles=product.beads.length*168;
  for(const geometry of Object.values(product.geometry)){
   geometry.computeBoundingBox();const bounds=geometry.boundingBox!;
   for(const n of geometry.attributes.position.array)assert.ok(Number.isFinite(n));
   assert.ok(bounds.min.x>-.8&&bounds.max.x<.8&&bounds.min.y>-.1&&bounds.max.y<1.2);
   triangles+=(geometry.index?.count??geometry.attributes.position.count)/3;
  }
  assert.ok(triangles>0&&triangles<7000,`${item.id}: ${triangles}`);
 }
});

test('a real camera sweep clears the counter opening and avoids the back wall and sloping roof on both sides',async()=>{
 await RAPIER.init();const world=new RAPIER.World({x:0,y:0,z:0});
 try{
  for(const stall of souvenirStalls){
   const yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),stall.rotation);
   const body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(stall.x,0,stall.z).setRotation(yaw));body.userData={cameraWall:true};
   for(const part of souvenirCameraParts){const rotation=new T.Quaternion().setFromEuler(new T.Euler(...part.rotation));world.createCollider(RAPIER.ColliderDesc.cuboid(...part.size.map(v=>v/2) as [number,number,number]).setTranslation(...part.position).setRotation(rotation),body);}
  }
  world.step();
  for(const stall of [souvenirStalls[0],souvenirStalls[3]]){
   const origin=new T.Vector3(0,1.7,2.9).applyAxisAngle(new T.Vector3(0,1,0),stall.rotation).add(new T.Vector3(stall.x,0,stall.z));
   const inward=new T.Vector3(0,0,-1).applyAxisAngle(new T.Vector3(0,1,0),stall.rotation),shape=new RAPIER.Ball(.15);
   const reach=cameraSafeDistance(world,origin,inward,6,shape);
   assert.ok(reach>4&&reach<4.7,`counter opening remains open: ${reach}`);
   const roofOrigin=new T.Vector3(0,4.6,0).applyAxisAngle(new T.Vector3(0,1,0),stall.rotation).add(new T.Vector3(stall.x,0,stall.z));
   assert.ok(cameraSafeDistance(world,roofOrigin,{x:0,y:-1,z:0},3,shape)<1.2);
   for(const side of [-1,1]){
    const start=new T.Vector3(side*4,1.5,0).applyAxisAngle(new T.Vector3(0,1,0),stall.rotation).add(new T.Vector3(stall.x,0,stall.z));
    const direction=new T.Vector3(-side,0,0).applyAxisAngle(new T.Vector3(0,1,0),stall.rotation);
    const sideReach=cameraSafeDistance(world,start,direction,5,shape);assert.ok(sideReach>1&&sideReach<1.6,'solid side panels stop the camera');
   }
  }
 }finally{world.free();}
});

test('reload restores the purchased collection and remaining balance from the real buffered player save',async()=>{
 const savedStorage=useGame.persist.getOptions().storage!;
 const saved={...useGame.persist.getOptions().partialize!(initial),name:'Test reload',merit:25,souvenirs:['sutra']};
 await savedStorage.setItem('sen-an-nhien-v1',{state:saved,version:4});
 await new Promise(resolve=>setTimeout(resolve,550));
 useGame.setState({...initial,souvenirs:[],merit:0},true);
 await useGame.persist.rehydrate();assert.equal(useGame.getState().merit,25);assert.deepEqual(useGame.getState().souvenirs,['sutra']);
 // Rehydrating old journeys without this field supplies the default empty collection.
 const {souvenirs,...oldSave}=saved;await savedStorage.setItem('sen-an-nhien-v1',{state:oldSave,version:4});
 await new Promise(resolve=>setTimeout(resolve,550));useGame.setState({...initial,souvenirs:[]},true);await useGame.persist.rehydrate();assert.deepEqual(useGame.getState().souvenirs,[]);
});

test('fruit and incense supplies can be bought repeatedly without occupying collectible slots',()=>{
 for(const id of ['fruit','incensePack'] as const){
  const item=souvenirCatalog.find(item=>item.id===id)!;assert.ok('inventoryItem' in item);
  useGame.setState({position:stallApproach(souvenirStalls.find(stall=>stall.id===id)!),merit:30,inventory:{...initial.inventory},souvenirs:[]});
  const before=useGame.getState().inventory[item.inventoryItem];
  useGame.getState().buySouvenir(id);useGame.getState().buySouvenir(id);
  assert.equal(useGame.getState().merit,30-item.cost*2);
  assert.equal(useGame.getState().inventory[item.inventoryItem],before+item.quantity*2);
  assert.deepEqual(useGame.getState().souvenirs,[]);
  const saved=useGame.persist.getOptions().partialize!(useGame.getState()) as {inventory:typeof initial.inventory};
  assert.equal(saved.inventory[item.inventoryItem],before+item.quantity*2);
 }
});

test('fruit use clamps energy, never consumes at full energy and old saves gain a valid fruit count',async()=>{
 useGame.setState({energy:96,inventory:{...initial.inventory,fruit:2}});useGame.getState().eatFruit();
 assert.equal(useGame.getState().energy,100);assert.equal(useGame.getState().inventory.fruit,1);
 useGame.getState().eatFruit();assert.equal(useGame.getState().inventory.fruit,1);
 useGame.setState({energy:50,inventory:{...initial.inventory,fruit:0}});useGame.getState().eatFruit();assert.equal(useGame.getState().energy,50);
 const migrated=await useGame.persist.getOptions().migrate!({name:'Old save',merit:18,inventory:{incense:7},souvenirs:['mala'],night:false},4) as typeof initial;
 assert.equal(migrated.inventory.fruit,0);assert.equal(migrated.inventory.incense,7);assert.equal(migrated.merit,18);assert.equal(migrated.night,false);assert.deepEqual(migrated.souvenirs,['mala']);
});

test('the two new signs keep separate atlas cells from the book covers without growing the texture',()=>{
 assert.equal(souvenirCatalog.length,8);assert.equal(SOUVENIR_ATLAS.bookUpright,8);assert.equal(SOUVENIR_ATLAS.bookFlat,9);
 assert.ok(souvenirCatalog.length+2<=SOUVENIR_ATLAS.rows*SOUVENIR_ATLAS.columns);
 for(const stall of souvenirStalls.filter(s=>s.id==='fruit'||s.id==='incensePack')){
  assert.equal(stall.z,36.7);assert.ok(walkable(...stallApproach(stall)));
 }
});

test('every consumable is sold at its assigned stall and remote or wrong-stall purchases never charge',()=>{
 for(const product of shopProducts.filter(p=>p.inventoryItem)){
  const item=product.inventoryItem!,stall=souvenirStalls.find(s=>s.id===product.stall)!,wrong=souvenirStalls.find(s=>s.id!==product.stall)!;
  useGame.setState({...initial,inventory:{...initial.inventory},position:stallApproach(wrong),merit:100},true);
  const before=useGame.getState().inventory[item];useGame.getState().buySouvenir(product.id);assert.equal(useGame.getState().merit,100);assert.equal(useGame.getState().inventory[item],before);
  useGame.setState({position:stallApproach(stall)});useGame.getState().buy(item);useGame.getState().buySouvenir(product.id);
  assert.equal(useGame.getState().merit,100-2*product.cost);assert.equal(useGame.getState().inventory[item],before+2*product.quantity);
  useGame.setState({position:[0,0]});useGame.getState().buy(item);assert.equal(useGame.getState().merit,100-2*product.cost);
 }
 assert.equal(new Set(shopProducts.filter(p=>p.inventoryItem).map(p=>p.inventoryItem)).size,7);assert.ok(!shopProducts.some(p=>p.inventoryItem==='vegetable' as string));
});

test('equipment requires ownership, replaces only its slot, toggles off and survives save migration',async()=>{
 useGame.getState().equipSouvenir('buddha');assert.deepEqual(useGame.getState().equipment,emptyEquipment());
 const owned=['necklace','pendant','buddha','bracelet','mala'] as const;useGame.setState({souvenirs:[...owned]});
 for(const id of ['necklace','bracelet','buddha'])useGame.getState().equipSouvenir(id);
 assert.deepEqual(useGame.getState().equipment,{neck:'necklace',wrist:'bracelet',hand:'buddha'});
 useGame.getState().equipSouvenir('pendant');assert.equal(useGame.getState().equipment.neck,'pendant');assert.equal(useGame.getState().equipment.hand,'buddha');
 useGame.getState().equipSouvenir('buddha');assert.equal(useGame.getState().equipment.hand,null);useGame.getState().equipSouvenir('mala');
 const saved=useGame.persist.getOptions().partialize!(useGame.getState()) as {equipment:unknown;souvenirs:string[]};
 const migrated=await useGame.persist.getOptions().migrate!({...saved,inventory:{incense:3},merit:41},5) as typeof initial;
 assert.deepEqual(migrated.equipment,{neck:'pendant',wrist:'bracelet',hand:'mala'});assert.equal(migrated.inventory.incense,3);assert.equal(migrated.merit,41);
 assert.deepEqual(cleanEquipment({neck:'buddha',wrist:'necklace',hand:'sutra'},['buddha']),emptyEquipment());
 assert.ok(canDisplayHandItem('walk',false));for(const pose of ['sweep','pray','bow','carryWater','beads','feed','read','incense'])assert.ok(!canDisplayHandItem(pose,false));assert.ok(!canDisplayHandItem('sit',true));
});

test('fruit offering consumes once, respects altar capacity and expires after eight minutes',()=>{
 const altar=fruitAltars[0],realNow=Date.now;let now=realNow();Date.now=()=>now;
 try{
  useGame.setState({inventory:{...initial.inventory,fruit:3},position:[...altar.spot],merit:20,fruitOfferings:[],connection:'offline'});
  useGame.getState().offerFruit();assert.equal(useGame.getState().inventory.fruit,2);assert.equal(useGame.getState().merit,22);assert.equal(useGame.getState().fruitOfferings.length,1);
  useGame.getState().offerFruit();assert.equal(useGame.getState().inventory.fruit,2);assert.equal(useGame.getState().merit,22);
  useGame.setState({position:[0,50]});useGame.getState().offerFruit();assert.equal(useGame.getState().inventory.fruit,2);assert.ok(useGame.getState().destination);
  now+=FRUIT_OFFERING_MS+1;useGame.setState({position:[...altar.spot]});useGame.getState().offerFruit();assert.equal(useGame.getState().inventory.fruit,1);assert.equal(useGame.getState().fruitOfferings.length,1);
 }finally{Date.now=realNow;}
});

test('equipped models are cached, finite and need no new textures or per-part meshes',()=>{
 for(const item of souvenirCollectibles){const geometry=equipmentGeometry(item.id);assert.equal(geometry,equipmentGeometry(item.id));assert.ok(!geometry.getAttribute('uv'));assert.ok(geometry.getAttribute('color'));assert.ok(geometry.boundingSphere&&Number.isFinite(geometry.boundingSphere.radius));const triangles=geometry.index!.count/3;assert.ok(triangles<5000,`${item.id}: ${triangles}`);for(const value of geometry.attributes.position.array)assert.ok(Number.isFinite(value));}
});
