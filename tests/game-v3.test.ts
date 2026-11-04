import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
// Node 18 ESM does not expose the browser Web Crypto global by default.
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
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

test('incense stops burning at 2m50, retains cooled red feet and later cleans them without losing progress',async()=>{
 const {INCENSE_BURN_MS,INCENSE_STUB_MS}=await import('../src/gameData.ts'),{incenseLife}=await import('../src/incenseLifecycle.ts');let now=1000000;const original=Date.now;Date.now=()=>now;
 try{const older=now-INCENSE_BURN_MS,recent=now-30000;useGame.setState({burningIncense:[older,recent],progress:{...defaults.progress,incense:2},lifetime:{...defaults.lifetime,incense:2}});useGame.getState().tick();assert.deepEqual(useGame.getState().burningIncense,[older,recent]);assert.equal(incenseLife(older,now).burning,false);assert.equal(incenseLife(older,now).remaining,0);assert.equal(incenseLife(older,now).retained,true);assert.equal(incenseLife(recent,now).burning,true);assert.equal(incenseLife(recent,recent+169999).burning,true);assert.equal(incenseLife(recent,recent+170000).burning,false);const saved:any=useGame.persist.getOptions().partialize!(useGame.getState());assert.deepEqual(saved.burningIncense,[older,recent]);now+=INCENSE_STUB_MS;useGame.getState().tick();assert.deepEqual(useGame.getState().burningIncense,[recent]);now+=INCENSE_BURN_MS;useGame.getState().tick();assert.deepEqual(useGame.getState().burningIncense,[]);assert.equal(useGame.getState().progress.incense,2);
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
 for(const seat of temple){assert.ok(Math.abs(seat.position[0])<11);assert.ok(Math.abs(seat.position[0])>=4);assert.ok(seat.position[2]>=-27&&seat.position[2]<-19.5);assert.equal(seat.position[1],2.28+(await import('../src/cushionData.ts')).CUSHION.seatLift);}
});
test('flower and lamp offerings require their own station, complete once and expire independently',async()=>{
 const {defaultOfferingStation}=await import('../src/templeFixtures.ts');const {templeOffering,OFFERING_DURATION}=await import('../src/gameData.ts');let time=100000;const original=Date.now;Date.now=()=>time;
 try{for(const kind of ['flower','candle'] as const){useGame.setState({...defaults,inventory:{...defaults.inventory},progress:{...defaults.progress},lifetime:{...defaults.lifetime},offerings:{flower:[],candle:[]},position:[0,-24]},true);
 const count=useGame.getState().inventory[kind];useGame.getState().perform(kind,defaultOfferingStation[kind].id);assert.equal(useGame.getState().inventory[kind],count);assert.deepEqual(useGame.getState().destination,templeOffering[kind].approach);
 useGame.setState({position:templeOffering[kind].approach});useGame.getState().perform(kind,defaultOfferingStation[kind].id);assert.equal(useGame.getState().action,kind);useGame.getState().perform(kind,defaultOfferingStation[kind].id);time+=OFFERING_DURATION;useGame.getState().tick();assert.equal(useGame.getState().inventory[kind],count-1);assert.equal(useGame.getState().offerings[kind].length,1);useGame.getState().tick();assert.equal(useGame.getState().inventory[kind],count-1);
 time+=templeOffering[kind].lifetime;useGame.getState().tick();assert.equal(useGame.getState().offerings[kind].length,0);assert.equal(useGame.getState().progress[kind],1);
 }}finally{Date.now=original}
});
test('cancelling or a full offering station never consumes an item',async()=>{
 const {defaultOfferingStation}=await import('../src/templeFixtures.ts');const {templeOffering}=await import('../src/gameData.ts');for(const kind of ['flower','candle'] as const){useGame.setState({...defaults,position:templeOffering[kind].approach,inventory:{...defaults.inventory},offerings:{flower:[],candle:[]}},true);const count=useGame.getState().inventory[kind];useGame.getState().perform(kind,defaultOfferingStation[kind].id);useGame.getState().stand();useGame.getState().tick();assert.equal(useGame.getState().inventory[kind],count);useGame.setState({offerings:{...useGame.getState().offerings,[kind]:Array(8).fill(Date.now())}});useGame.getState().perform(kind,defaultOfferingStation[kind].id);assert.equal(useGame.getState().action,'walk');assert.equal(useGame.getState().inventory[kind],count);}
});

test('navigation reaches every temple cushion while avoiding restored columns',async()=>{
 const {seats,distance}=await import('../src/gameData.ts');const {findPath}=await import('../src/navigation.ts');for(const seat of seats.filter(s=>s.zone==='temple')){const path=findPath([0,22],[seat.position[0],seat.position[2]]);assert.ok(path.length,seat.id);assert.ok(distance(path[path.length-1],[seat.position[0],seat.position[2]])<1,seat.id);}
});

test('replacement arms have sealed cut boundaries',async()=>{
 const THREE=await import('three'),{closeCutSurface}=await import('../src/templeGeometry.ts');const box=new THREE.BoxGeometry(1,1,1);box.setIndex(Array.from(box.index!.array).slice(6));const sealed=closeCutSurface(box),p=sealed.attributes.position,ix=sealed.index!,edges=new Map<string,number>();const key=(id:number)=>[p.getX(id),p.getY(id),p.getZ(id)].map(v=>v.toFixed(4)).join(',');
 for(let i=0;i<ix.count;i+=3)for(let j=0;j<3;j++){const a=key(ix.getX(i+j)),b=key(ix.getX(i+(j+1)%3));const edge=[a,b].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1)}assert.ok([...edges.values()].every(count=>count===2));
});
test('temple physics keeps ground visitors below the platform and blocks the railing',async()=>{
 const R=await import('@dimforge/rapier3d-compat');await R.init();const {templeColliders}=await import('../src/templeCollisionData.ts');const {CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS,stepAssistHeight}=await import('../src/gameData.ts');
 const run=(x:number,y:number,z:number,dx:number,steps:number,dz=0)=>{const world=new R.World({x:0,y:-9.81,z:0});world.createCollider(R.ColliderDesc.cuboid(100,.1,100).setTranslation(0,-.04,0));const fixed=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0,.08,-27));for(const shape of templeColliders){const a=shape.args;const desc=shape.kind==='box'?R.ColliderDesc.cuboid(a[0],a[1],a[2]!):R.ColliderDesc.cylinder(a[0],a[1]);desc.setTranslation(...shape.position);if(shape.rotationX){const h=shape.rotationX/2;desc.setRotation({x:Math.sin(h),y:0,z:0,w:Math.cos(h)})}world.createCollider(desc,fixed)}const body=world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(x,y,z)),collider=world.createCollider(R.ColliderDesc.capsule(CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS),body),controller=world.createCharacterController(.02);controller.enableAutostep(.25,.15,true);controller.enableSnapToGround(.35);world.step();let vertical=0;for(let i=0;i<steps;i++){const before=body.translation(),assisted=stepAssistHeight(before.x,before.z,dx,dz,before.y);if(assisted>before.y)body.setTranslation({x:before.x,y:assisted,z:before.z},true);vertical=Math.max(-15,vertical-9.81/60);controller.computeColliderMovement(collider,{x:dx,y:vertical/60,z:dz});if(controller.computedGrounded())vertical=0;const d=controller.computedMovement(),p=body.translation();body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});world.step()}const result={...body.translation()};world.free();return result;};
 const ramp=run(0,.78,-10,0,240,-.05);assert.ok(ramp.y>2.9&&ramp.z< -18.7,'visitor climbs the entrance ramp into the nave');const outside=run(15.5,3,-25,0,120);assert.ok(outside.y<1,'visitor outside the foundation stays on ground');const rail=run(13.3,2.99,-20,.05,80);assert.ok(rail.x<13.7,'visitor cannot step onto the railing');assert.ok(rail.y<3.2,'visitor is not lifted onto the railing');const besideStairs=run(8.3,3,-14,0,160);assert.ok(besideStairs.y<1,'no invisible ramp beside the visible staircase');const pastPorch=run(10,3,-16.2,0,160);assert.ok(pastPorch.y<1,'no invisible foundation in front of the porch');const sideEntry=run(9.5,.78,-14,-.05,100);assert.ok(sideEntry.x>7.6,'cannot enter the staircase underside from the side');
});

test('offerings fit the measured vase and table and foundation height ends at the visible edge',async()=>{const {templeFixtures:f,lampPlacement,templeSurfaceHeight}=await import('../src/templeFixtures.ts');assert.deepEqual(f.flowerMouth,[-3.7,3.25,-2.835]);for(let i=0;i<8;i++){const [x,y,z]=lampPlacement(i);assert.ok(Math.abs(x-f.lampTable.x)+.12<f.lampTable.halfWidth);assert.ok(Math.abs(z-f.lampTable.z)+.12<f.lampTable.halfDepth);assert.equal(y,2.843)}assert.equal(templeSurfaceHeight(8.3,13),0);assert.equal(templeSurfaceHeight(10,10.8),0);assert.equal(templeSurfaceHeight(0,0),2.2)});

test('each reference vase and all three altars retain their own offerings after completion and persistence',async()=>{
 const {offeringStations,offeringStation}=await import('../src/templeFixtures.ts');const {OFFERING_DURATION}=await import('../src/gameData.ts');const original=Date.now;let now=500000;Date.now=()=>now;
 try{useGame.setState({...defaults,inventory:{...defaults.inventory,flower:40,candle:40},offerings:{flower:[],candle:[]},offeringSlots:{}},true);for(const kind of ['flower','candle'] as const){for(const station of offeringStations[kind]){useGame.setState({position:station.approach,event:null});useGame.getState().perform(kind,station.id);assert.equal(useGame.getState().event?.target,station.id);now+=OFFERING_DURATION;useGame.getState().tick();const times=useGame.getState().offerings[kind];assert.equal(offeringStation(kind,useGame.getState().offeringSlots[times[times.length-1]]).id,station.id)}assert.equal(useGame.getState().offerings[kind].length,offeringStations[kind].length)}const saved=useGame.persist.getOptions().partialize!(useGame.getState()) as any;assert.equal(Object.keys(saved.offeringSlots).length,17);assert.equal(useGame.getState().inventory.flower,26);assert.equal(useGame.getState().inventory.candle,37);
 }finally{Date.now=original}
});
test('a full vase does not block another vase and expired placements are removed',async()=>{
 const {offeringStations,offeringCount}=await import('../src/templeFixtures.ts');const {templeOffering,OFFERING_DURATION}=await import('../src/gameData.ts');const first=offeringStations.flower[0],second=offeringStations.flower[1],now=Date.now(),times=Array.from({length:8},(_,i)=>now-i);useGame.setState({...defaults,position:first.approach,inventory:{...defaults.inventory},offerings:{flower:times,candle:[]},offeringSlots:Object.fromEntries(times.map(t=>[t,first.id]))},true);useGame.getState().perform('flower',first.id);assert.equal(useGame.getState().action,'walk');useGame.setState({position:second.approach});useGame.getState().perform('flower',second.id);assert.equal(useGame.getState().action,'flower');useGame.setState({event:{...useGame.getState().event!,at:now-OFFERING_DURATION}});useGame.getState().tick();assert.equal(offeringCount(useGame.getState().offerings.flower,useGame.getState().offeringSlots,second,now,templeOffering.flower.lifetime),1);const original=Date.now;try{Date.now=()=>now+templeOffering.flower.lifetime+1000;useGame.getState().tick();assert.equal(Object.keys(useGame.getState().offeringSlots).length,0)}finally{Date.now=original}
});
test('the merit chest routes distant visitors and opens the existing donation panel nearby without spending items',async()=>{
 const {visitDonationChest}=await import('../src/gameStore.ts'),{donationChest}=await import('../src/templeFixtures.ts');useGame.setState({...defaults,position:[0,22],inventory:{...defaults.inventory}},true);visitDonationChest();assert.equal(useGame.getState().panel,null);assert.ok(useGame.getState().destination);useGame.setState({position:[donationChest.spot[0],donationChest.spot[1]+1.3]});visitDonationChest();assert.equal(useGame.getState().panel,'donate');assert.equal(useGame.getState().destination,null);assert.deepEqual(useGame.getState().inventory,defaults.inventory);assert.equal(useGame.getState().merit,defaults.merit);
});

test('the two front flower vases are decorative and cannot start an offering',async()=>{const {offeringStations,offeringStation}=await import('../src/templeFixtures.ts');assert.equal(offeringStations.flower.length,14);assert.ok(offeringStations.flower.every(s=>!s.id.startsWith('flower-front-')));for(const id of ['flower-front-0','flower-front-1']){useGame.setState({...defaults,position:[2.9,-27.35],inventory:{...defaults.inventory}},true);useGame.getState().perform('flower',id);assert.equal(useGame.getState().action,'walk');assert.deepEqual(useGame.getState().inventory,defaults.inventory);assert.ok(!offeringStation('flower',id).id.startsWith('flower-front-'))}});
test('flowers and lamps both remain for eight minutes and expired placement metadata is removed',async()=>{const {templeOffering}=await import('../src/gameData.ts');assert.equal(templeOffering.flower.lifetime,480000);assert.equal(templeOffering.candle.lifetime,480000);const original=Date.now,start=1000000;let now=start;Date.now=()=>now;try{useGame.setState({...defaults,offerings:{flower:[start],candle:[start+1]},offeringSlots:{[start]:'flower-table-0',[start+1]:'candle-table-0'}},true);now=start+479999;useGame.getState().tick();assert.equal(useGame.getState().offerings.flower.length,1);assert.equal(useGame.getState().offerings.candle.length,1);now=start+480001;useGame.getState().tick();assert.equal(useGame.getState().offerings.flower.length,0);assert.equal(useGame.getState().offerings.candle.length,0);assert.deepEqual(useGame.getState().offeringSlots,{})}finally{Date.now=original}});
test('retained incense is bounded even after restoring an oversized save',async()=>{const {INCENSE_MAX_STICKS}=await import('../src/gameData.ts'),now=Date.now();const times=Array.from({length:INCENSE_MAX_STICKS+10},(_,i)=>now-1000*(INCENSE_MAX_STICKS+10-i));useGame.setState({...defaults,burningIncense:times},true);useGame.getState().tick();assert.deepEqual(useGame.getState().burningIncense,times.slice(-INCENSE_MAX_STICKS))});
test('actual facade geometry removes gold and gold-light motifs on brick but preserves inner door ornaments',async()=>{
 const T=await import('three'),{templeParts}=await import('../src/templeGeometry.ts'),{strayFacadeOrnament}=await import('../src/templeLayout.ts');const b=await readFile(new URL('../public/assets/main-temple/tam-the-complete.glb',import.meta.url)),length=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+length).toString()),offset=28+length;let gold=0,light=0,kept=0;
 const attr=(id:number)=>{const a=j.accessors[id],v=j.bufferViews[a.bufferView],A=a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:Uint16Array;return new T.BufferAttribute(new A(b.buffer,b.byteOffset+offset+(v.byteOffset||0)+(a.byteOffset||0),a.count*(a.type==='VEC3'?3:1)),a.type==='VEC3'?3:1)};
 for(const mesh of j.meshes)for(const primitive of mesh.primitives){const name=j.materials[primitive.material].name;if(!/^gold/.test(name))continue;const g=new T.BufferGeometry();g.setAttribute('position',attr(primitive.attributes.POSITION));g.setIndex(attr(primitive.indices));for(const part of templeParts(g)){const c=part.box.getCenter(new T.Vector3()).multiplyScalar(.5),size=part.box.getSize(new T.Vector3()).multiplyScalar(.5);if(Math.abs(c.z-7.59)>.055||c.y<2.4||c.y>5)continue;if(Math.abs(c.x)>5.9&&Math.abs(c.x)<6.9){assert.equal(strayFacadeOrnament(name,c,size),true);if(name==='gold')gold++;else light++}else if(name==='gold'&&Math.abs(c.x)<5.9){assert.equal(strayFacadeOrnament(name,c,size),false);kept++}}g.dispose()}
 assert.equal(gold,4);assert.equal(light,20);assert.equal(kept,16);
});

test('online offering waits for acknowledgement, consumes once and never creates a private duplicate',async()=>{
 const {setOfferingTransport}=await import('../src/offeringTransport.ts');
 let accept!:()=>void,requests=0;
 setOfferingTransport(async()=>{requests++;await new Promise<void>(resolve=>{accept=resolve})});
 try{
  useGame.setState({connection:'online',position:[0,-7.1],inventory:{...defaults.inventory,incense:3},action:'incense',event:{type:'incense',at:Date.now()-4000,x:0,z:-7.1}});
  useGame.getState().tick();assert.equal(requests,1);assert.equal(useGame.getState().inventory.incense,3);
  useGame.getState().perform('incense');useGame.getState().tick();assert.equal(requests,1);
  accept();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(useGame.getState().inventory.incense,2);assert.equal(useGame.getState().burningIncense.length,0);assert.equal(useGame.getState().progress.incense,1);
  setOfferingTransport(async()=>{throw new Error('offline')});
  useGame.setState({action:'incense',event:{type:'incense',at:Date.now()-4000,x:0,z:-7.1}});useGame.getState().tick();await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(useGame.getState().inventory.incense,2);assert.equal(useGame.getState().progress.incense,1);
 }finally{setOfferingTransport(null)}
});

test('fish feeding requires shore proximity, supplies and cooldown',()=>{
 useGame.setState({connection:'offline',position:[0,22]});const before=useGame.getState().inventory.feed;
 useGame.getState().perform('feed');assert.ok(useGame.getState().destination);assert.equal(useGame.getState().inventory.feed,before);
 useGame.setState({position:[23.6,9]});useGame.getState().perform('feed');assert.equal(useGame.getState().inventory.feed,before-1);assert.equal(useGame.getState().progress.feed,1);
 useGame.getState().perform('feed');assert.equal(useGame.getState().inventory.feed,before-1);
 useGame.setState({fishFeedAt:0,lastFishFedAt:0,inventory:{...defaults.inventory,feed:0}});useGame.getState().perform('feed');assert.equal(useGame.getState().panel,'bag');assert.equal(useGame.getState().progress.feed,1);
});
test('feeding koi targets stay inside the pond near the food',async()=>{
 const {koiTarget}=await import('../src/fishFeeding.ts');for(let i=0;i<15;i++)for(let t=0;t<12;t++){const [x,z]=koiTarget(i,t,true);assert.ok(Math.hypot(x-22,z-6)<2);assert.ok(((x-28)/8.5)**2+((z-4)/11)**2<1)}
});

test('elliptical koi bank blocks water but leaves bridge and bank corners open',async()=>{
 const {pondBlocked,bridgeHeight,feedStations}=await import('../src/pondLayout.ts');
 assert.equal(pondBlocked(33,15),true);assert.equal(pondBlocked(33,9),false);assert.equal(pondBlocked(25,-1),false);
 assert.ok(Math.abs(bridgeHeight(22)-.06)<.001);assert.ok(Math.abs(bridgeHeight(24)-.44)<.001);assert.equal(bridgeHeight(17),bridgeHeight(44));
 assert.equal(feedStations.length,18);for(const f of feedStations){assert.equal(pondBlocked(...f.spot),false);assert.ok(((f.target[0]-33)/8.5)**2+((f.target[1]-9)/11)**2<1)}
});

test('online garden does not consume supplies before acknowledgement or award rejected harvests',async()=>{
 const {setGardenTransport}=await import('../src/gardenTransport.ts');let accept!:()=>void,requests=0;
 setGardenTransport(async()=>{requests++;await new Promise<void>(r=>{accept=r})});
 try{
  useGame.setState({connection:'online',position:[31,-51.5]});const seeds=useGame.getState().inventory.seed;
  useGame.getState().garden('plot-0');useGame.getState().garden('plot-0');assert.equal(requests,0);assert.equal(useGame.getState().progress.plant,0);await new Promise(r=>setTimeout(r,2050));assert.equal(requests,1);assert.equal(useGame.getState().inventory.seed,seeds);
  accept();await new Promise(r=>setTimeout(r,0));assert.equal(useGame.getState().inventory.seed,seeds-1);assert.equal(useGame.getState().progress.plant,1);assert.deepEqual(useGame.getState().plots,{});
  useGame.setState({plots:{'plot-0':{plantedAt:Date.now()-70000,wateredAt:Date.now()-65000,harvested:false,revision:2}}});
  setGardenTransport(async()=>{throw new Error('Luống vừa được thu hoạch.')});useGame.getState().garden('plot-0');await new Promise(r=>setTimeout(r,2050));assert.equal(useGame.getState().inventory.vegetable,0);assert.equal(useGame.getState().progress.harvest,0);assert.equal(useGame.getState().gardenPending,null);
 }finally{setGardenTransport(null)}
});
