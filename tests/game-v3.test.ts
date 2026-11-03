import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const values=new Map<string,string>();let writes=0;
const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{writes++;values.set(key,value)},removeItem:(key:string)=>values.delete(key)} as Storage;
Object.defineProperty(globalThis,'window',{value:{localStorage:storage}});
const {useGame}=await import('../src/gameStore.ts');
const {createBufferedStorage}=await import('../src/saveStorage.ts');
const {normalizeDonationNote}=await import('../src/DonationPanel.tsx');
const defaults=useGame.getInitialState();
beforeEach(()=>useGame.setState({...defaults},true));
test('rapid prayer toggles always return a standing character to walking, even during event cooldown',()=>{
  useGame.setState({event:{type:'bell',at:Date.now(),x:0,z:0}});
  for(let i=0;i<30;i++){useGame.getState().perform('pray');assert.equal(useGame.getState().action,i%2===0?'pray':'walk');assert.equal(useGame.getState().seated,null)}
});
test('prayer toggles on a real seat retain the seat and return to sitting',()=>{
  useGame.setState({seated:'temple-0',action:'sit'});useGame.getState().perform('pray');assert.equal(useGame.getState().action,'pray');useGame.getState().perform('pray');assert.equal(useGame.getState().action,'sit');assert.equal(useGame.getState().seated,'temple-0');
});
test('new and migrated V2 journeys open character selection without losing progress',async()=>{
  assert.equal(defaults.characterConfigured,false);
  const migrate=useGame.persist.getOptions().migrate!;
  const old:any=await migrate({name:'Sen',started:true,merit:125,inventory:{feed:7},progress:{meal:2}},2);
  const merged={...defaults,...old};assert.equal(merged.characterConfigured,false);assert.equal(merged.merit,125);assert.equal(merged.inventory.feed,7);assert.equal(merged.progress.meal,2);
  const partialize=useGame.persist.getOptions().partialize!;
  const saved:any=partialize({...defaults,gender:'female',robe:'#79868c',skin:'#b58a66',robeStyle:'cross',characterConfigured:true});assert.equal(saved.gender,'female');assert.equal(saved.characterConfigured,true);assert.equal(saved.skin,'#b58a66');assert.ok(!('position' in saved));
});
test('movement snapshots do not write storage, while changed preferences are buffered and latest state wins',async()=>{
  const key='sen-v3-buffer-test',buffer=createBufferedStorage(()=>storage),pause=()=>new Promise(resolve=>setTimeout(resolve,550));
  await pause();const start=writes;
  buffer.setItem(key,'A');for(let i=0;i<100;i++)buffer.setItem(key,'A');assert.equal(writes,start);await pause();assert.equal(writes,start+1);
  for(let i=0;i<100;i++)buffer.setItem(key,'A');await pause();assert.equal(writes,start+1);
  buffer.setItem(key,'B');buffer.setItem(key,'C');await pause();assert.equal(values.get(key),'C');assert.equal(writes,start+2);
  buffer.setItem(key,'D');buffer.setItem(key,'C');await pause();assert.equal(values.get(key),'C');assert.equal(writes,start+2);
});
test('donation ships without any recipient or active QR and normalizes optional bank note',async()=>{
  const config=JSON.parse(await readFile(new URL('../public/donation.json',import.meta.url),'utf8'));
  assert.equal(config.enabled,false);assert.equal(config.accountNumber,'');assert.equal(config.recipientName,'');assert.ok(config.qrImage.startsWith('/donate/'));
  assert.equal(normalizeDonationNote('An Nhiên Đỗ!'),'An Nhien Do');assert.equal(normalizeDonationNote('a'.repeat(40)).length,20);
});

test('incense requires proximity and completes once after three seconds',()=>{
  let now=100000;const original=Date.now;Date.now=()=>now;
  try{
    useGame.setState({position:[0,-24],inventory:{...defaults.inventory},progress:{...defaults.progress},lifetime:{...defaults.lifetime}});
    useGame.getState().perform('incense');assert.equal(useGame.getState().inventory.incense,10);assert.equal(useGame.getState().action,'walk');assert.deepEqual(useGame.getState().destination,[0,-7.1]);
    useGame.setState({position:[0,-7.1]});useGame.getState().perform('incense');assert.equal(useGame.getState().action,'incense');assert.equal(useGame.getState().inventory.incense,10);
    now+=1000;useGame.getState().perform('incense');useGame.getState().tick();assert.equal(useGame.getState().progress.incense,0);
    now+=2000;useGame.getState().tick();assert.equal(useGame.getState().inventory.incense,9);assert.equal(useGame.getState().progress.incense,1);useGame.getState().tick();assert.equal(useGame.getState().inventory.incense,9);
  }finally{Date.now=original}
});
test('incense can be cancelled and cannot start without supplies',()=>{
  useGame.setState({position:[0,-7.1],inventory:{...defaults.inventory}});useGame.getState().perform('incense');useGame.getState().stand();useGame.getState().tick();assert.equal(useGame.getState().inventory.incense,10);
  useGame.setState({inventory:{...defaults.inventory,incense:0}});useGame.getState().perform('incense');assert.equal(useGame.getState().action,'walk');assert.equal(useGame.getState().panel,'bag');
});

test('incense burns out independently, persists and retains progress',()=>{
  let now=100000;const original=Date.now;Date.now=()=>now;
  try{
    useGame.setState({burningIncense:[now-60000,now-30000],progress:{...defaults.progress,incense:2},lifetime:{...defaults.lifetime,incense:2}});
    useGame.getState().tick();assert.deepEqual(useGame.getState().burningIncense,[70000]);assert.equal(useGame.getState().lifetime.incense,2);
    const saved:any=useGame.persist.getOptions().partialize!(useGame.getState());assert.deepEqual(saved.burningIncense,[70000]);
    now+=30000;useGame.getState().tick();assert.deepEqual(useGame.getState().burningIncense,[]);assert.equal(useGame.getState().progress.incense,2);
  }finally{Date.now=original}
});

test('incense burner excludes player positions and redirects an overlapping offering',async()=>{
 const {incenseSpot,incenseApproach,INCENSE_CLEARANCE,outsideIncenseBurner,distance}=await import('../src/gameData.ts');
 assert.deepEqual(outsideIncenseBurner(...incenseSpot),incenseApproach);
 for(const [dx,dz] of [[.1,0],[-.2,.1],[0,-.3],[.8,.2]]){const safe=outsideIncenseBurner(incenseSpot[0]+dx,incenseSpot[1]+dz);assert.ok(distance(safe,incenseSpot)>=INCENSE_CLEARANCE-1e-9);}
 useGame.setState({position:incenseSpot,inventory:{...defaults.inventory}});useGame.getState().perform('incense');assert.equal(useGame.getState().action,'walk');assert.deepEqual(useGame.getState().destination,incenseApproach);assert.equal(useGame.getState().inventory.incense,10);
});

test('temple seats are inside the nave with an open centre aisle',async()=>{
 const {seats}=await import('../src/gameData.ts');const temple=seats.filter(s=>s.zone==='temple');assert.equal(temple.length,48);
 for(const seat of temple){assert.ok(Math.abs(seat.position[0])<11);assert.ok(Math.abs(seat.position[0])>=4);assert.ok(seat.position[2]>=-27&&seat.position[2]<-19.5);assert.equal(seat.position[1],2.28);}
});
test('flower and lamp offerings require their own station, complete once and expire independently',async()=>{
 const {templeOffering,OFFERING_DURATION}=await import('../src/gameData.ts');let time=100000;const original=Date.now;Date.now=()=>time;
 try{for(const kind of ['flower','candle'] as const){useGame.setState({...defaults,inventory:{...defaults.inventory},progress:{...defaults.progress},lifetime:{...defaults.lifetime},offerings:{flower:[],candle:[]},position:[0,-24]},true);
 const count=useGame.getState().inventory[kind];useGame.getState().perform(kind);assert.equal(useGame.getState().inventory[kind],count);assert.deepEqual(useGame.getState().destination,templeOffering[kind].approach);
 useGame.setState({position:templeOffering[kind].approach});useGame.getState().perform(kind);assert.equal(useGame.getState().action,kind);useGame.getState().perform(kind);time+=OFFERING_DURATION;useGame.getState().tick();assert.equal(useGame.getState().inventory[kind],count-1);assert.equal(useGame.getState().offerings[kind].length,1);useGame.getState().tick();assert.equal(useGame.getState().inventory[kind],count-1);
 time+=templeOffering[kind].lifetime;useGame.getState().tick();assert.equal(useGame.getState().offerings[kind].length,0);assert.equal(useGame.getState().progress[kind],1);
 }}finally{Date.now=original}
});
test('cancelling or a full offering station never consumes an item',async()=>{
 const {templeOffering}=await import('../src/gameData.ts');for(const kind of ['flower','candle'] as const){useGame.setState({...defaults,position:templeOffering[kind].approach,inventory:{...defaults.inventory},offerings:{flower:[],candle:[]}},true);const count=useGame.getState().inventory[kind];useGame.getState().perform(kind);useGame.getState().stand();useGame.getState().tick();assert.equal(useGame.getState().inventory[kind],count);useGame.setState({offerings:{...useGame.getState().offerings,[kind]:Array(8).fill(Date.now())}});useGame.getState().perform(kind);assert.equal(useGame.getState().action,'walk');assert.equal(useGame.getState().inventory[kind],count);}
});

test('navigation reaches every temple cushion while avoiding restored columns',async()=>{
 const {seats,distance}=await import('../src/gameData.ts');const {findPath}=await import('../src/navigation.ts');for(const seat of seats.filter(s=>s.zone==='temple')){const path=findPath([0,22],[seat.position[0],seat.position[2]]);assert.ok(path.length,seat.id);assert.ok(distance(path[path.length-1],[seat.position[0],seat.position[2]])<1,seat.id);}
});

test('replacement arms have sealed cut boundaries',async()=>{
 const THREE=await import('three'),{closeCutSurface}=await import('../src/templeGeometry.ts');const box=new THREE.BoxGeometry(1,1,1);box.setIndex(Array.from(box.index!.array).slice(6));const sealed=closeCutSurface(box),p=sealed.attributes.position,ix=sealed.index!,edges=new Map<string,number>();const key=(id:number)=>[p.getX(id),p.getY(id),p.getZ(id)].map(v=>v.toFixed(4)).join(',');
 for(let i=0;i<ix.count;i+=3)for(let j=0;j<3;j++){const a=key(ix.getX(i+j)),b=key(ix.getX(i+(j+1)%3));const edge=[a,b].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1)}assert.ok([...edges.values()].every(count=>count===2));
});
test('temple physics keeps ground visitors below the platform and blocks the railing',async()=>{
 const R=await import('@dimforge/rapier3d-compat');await R.init();const {templeColliders}=await import('../src/templeCollisionData.ts');
 const run=(x:number,y:number,z:number,dx:number,steps:number,dz=0)=>{const world=new R.World({x:0,y:-9.81,z:0});world.createCollider(R.ColliderDesc.cuboid(100,.1,100).setTranslation(0,-.04,0));const fixed=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0,.08,-27));for(const shape of templeColliders){const a=shape.args;const desc=shape.kind==='box'?R.ColliderDesc.cuboid(a[0],a[1],a[2]!):R.ColliderDesc.cylinder(a[0],a[1]);desc.setTranslation(...shape.position);if(shape.rotationX){const h=shape.rotationX/2;desc.setRotation({x:Math.sin(h),y:0,z:0,w:Math.cos(h)})}world.createCollider(desc,fixed)}const body=world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(x,y,z)),collider=world.createCollider(R.ColliderDesc.capsule(.4,.28),body),controller=world.createCharacterController(.02);controller.enableAutostep(.25,.15,true);controller.enableSnapToGround(.35);world.step();let vertical=0;for(let i=0;i<steps;i++){vertical=Math.max(-15,vertical-9.81/60);controller.computeColliderMovement(collider,{x:dx,y:vertical/60,z:dz});if(controller.computedGrounded())vertical=0;const d=controller.computedMovement(),p=body.translation();body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});world.step()}const result={...body.translation()};world.free();return result;};
 const ramp=run(0,.78,-10,0,240,-.05);assert.ok(ramp.y>2.9&&ramp.z< -18.7,'visitor climbs the entrance ramp into the nave');const outside=run(15.5,3,-25,0,120);assert.ok(outside.y<1,'visitor outside the foundation stays on ground');const rail=run(13,2.99,-17,.05,80);assert.ok(rail.x<13.85,'visitor cannot step onto the railing');assert.ok(rail.y<3.2,'visitor is not lifted onto the railing');
});
