import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorldSnapshotApplier,type WorldSnapshot} from '../src/worldSnapshot';
import {gateState} from '../src/gateState';
import {FRUIT_OFFERING_MS} from '../src/fruitOfferingData';
import {LANTERN_LIFETIME} from '../src/ritualMotion';

const server=1700000000000;
function snapshot(patch:Partial<WorldSnapshot>={}):WorldSnapshot{
 return {bell:null,drum:null,gateOpen:true,waterJars:[{units:2,at:server-3000}],lanterns:[],leaves:{epoch:server-10000,revision:0,cleared:[]},...patch};
}

test('two client clocks see the same shared event ages and stable lantern seeds',()=>{
 const world=snapshot({
  bell:{at:server-2000,readyAt:server+14000},drum:{at:server-1000},
  lanterns:[{at:server-500,text:'Bình an'}],
  fireworks:{at:server-45000,seed:12345,companyPresentationEnabled:true,owner:'host'},
  fruitOfferings:[{altar:'temple',at:server-4000,owner:'host'}],
 });
 for(const skew of [-3600000,7200000]){
  const now=server+skew,patch=createWorldSnapshotApplier()(world,server,now);
  assert.equal(now-patch.worldBellAt!,2000);
  assert.equal(patch.worldBellReadyAt!-now,14000);
  assert.equal(now-patch.worldDrumAt!,1000);
  assert.equal(now-patch.flights![0].at,500);
  assert.equal(patch.flights![0].serverAt,server-500);
  assert.equal(now-patch.fireworksShow!.startAt,45000);
  assert.equal(patch.fireworksShow!.seed,12345);
  assert.equal(patch.fireworksShow!.companyPresentationEnabled,true);
  assert.equal(now-patch.fruitOfferings![0].at,4000);
  assert.equal(now-patch.waterJars![0].at,3000);
 }
});

test('duplicate snapshots retain event starts while restoring authoritative scene state',()=>{
 const apply=createWorldSnapshotApplier(),local=server+90000;
 const world=snapshot({
  bell:{at:server-2000,readyAt:server+14000},drum:{at:server-1000},
  lanterns:[{at:server-500,text:'Bình an'}],
  fireworks:{at:server-10000,seed:44,companyPresentationEnabled:false},
  fruitOfferings:[{altar:'bodhi',at:server-1000}],
 });
 const first=apply(world,server,local);
 // A later snapshot has a different delivery delay; it must not restart audio,
 // flight keys, fireworks, or the lifetime of an existing fruit offering.
 const duplicate=apply(world,server+1000,local+1080);
 assert.equal(duplicate.worldBellAt,first.worldBellAt);
 assert.equal(duplicate.worldBellReadyAt,first.worldBellReadyAt);
 assert.equal(duplicate.worldDrumAt,first.worldDrumAt);
 assert.deepEqual(duplicate.flights,first.flights);
 assert.equal(duplicate.fireworksShow,first.fireworksShow);
 assert.deepEqual(duplicate.fruitOfferings,first.fruitOfferings);
 assert.equal(duplicate.sharedWorld!.serverOffset,90080);

 const staleLocal={flights:[{text:'Offline only',at:local+500}],fireworksShow:null,fruitOfferings:[]};
 const restored={...staleLocal,...duplicate};
 assert.deepEqual(restored.flights,first.flights);
 assert.equal(restored.fireworksShow,first.fireworksShow);
 assert.deepEqual(restored.fruitOfferings,first.fruitOfferings);
});

test('late joiners resume the current show and lanterns at the server elapsed time',()=>{
 const world=snapshot({
  fireworks:{at:server,seed:91,companyPresentationEnabled:true},
  lanterns:[{at:server+100000,text:'Cùng bình an'}],
 });
 const host=createWorldSnapshotApplier()(world,server+100000,server+105000);
 const lateServer=server+119000,lateNow=lateServer-270000;
 const late=createWorldSnapshotApplier()(world,lateServer,lateNow);
 assert.equal(lateNow-late.fireworksShow!.startAt,119000);
 assert.equal(lateNow-late.flights![0].at,19000);
 assert.equal(late.fireworksShow!.seed,host.fireworksShow!.seed);
 assert.equal(late.flights![0].serverAt,host.flights![0].serverAt);
});

test('a changed fireworks event starts once and stop or a legacy snapshot clears it',()=>{
 const apply=createWorldSnapshotApplier(),local=server+30000;
 const first=apply(snapshot({fireworks:{at:server,seed:7,companyPresentationEnabled:false}}),server,local);
 const changed=apply(snapshot({fireworks:{at:server+5000,seed:8,companyPresentationEnabled:true}}),server+5000,local+5000);
 assert.notEqual(changed.fireworksShow,first.fireworksShow);
 assert.deepEqual(changed.fireworksShow,{serverAt:server+5000,startAt:local+5000,seed:8,companyPresentationEnabled:true});
 assert.equal(apply(snapshot({fireworks:null}),server+6000,local+6000).fireworksShow,null);
 assert.equal(apply(snapshot(),server+7000,local+7000).fireworksShow,null,'legacy snapshots cannot leave an old local show playing');
});

test('empty room snapshots clear rituals, flights, fruit, and fireworks',()=>{
 const apply=createWorldSnapshotApplier();
 apply(snapshot({
  bell:{at:server-100,readyAt:server+15900},drum:{at:server-100},
  lanterns:[{at:server-100,text:'A'}],fireworks:{at:server-100,seed:1,companyPresentationEnabled:false},
  fruitOfferings:[{altar:'quan-am',at:server-100}],
 }),server,server+50000);
 const clear=apply(snapshot({gateOpen:false,waterJars:[]}),server+1000,server+51000);
 assert.equal(clear.worldBellAt,0);
 assert.equal(clear.worldBellReadyAt,0);
 assert.equal(clear.worldDrumAt,0);
 assert.deepEqual(clear.flights,[]);
 assert.deepEqual(clear.fruitOfferings,[]);
 assert.equal(clear.fireworksShow,null);
 assert.deepEqual(clear.waterJars,[]);
 assert.equal(gateState.getState().open,false);
});

test('expired server events disappear at their lifetime boundary, including unchanged lists',()=>{
 const apply=createWorldSnapshotApplier(),local=server+60000;
 const world=snapshot({
  lanterns:[{at:server,text:'A'}],
  fireworks:{at:server,seed:1,companyPresentationEnabled:false},
  fruitOfferings:[{altar:'temple',at:server}],
 });
 assert.equal(apply(world,server+LANTERN_LIFETIME-1,local+LANTERN_LIFETIME-1).flights!.length,1);
 assert.deepEqual(apply(world,server+LANTERN_LIFETIME,local+LANTERN_LIFETIME).flights,[]);
 assert.ok(apply(world,server+299999,local+299999).fireworksShow);
 assert.equal(apply(world,server+300000,local+300000).fireworksShow,null);
 assert.equal(apply(world,server+FRUIT_OFFERING_MS-1,local+FRUIT_OFFERING_MS-1).fruitOfferings!.length,1);
 assert.deepEqual(apply(world,server+FRUIT_OFFERING_MS,local+FRUIT_OFFERING_MS).fruitOfferings,[]);
});

test('fruit snapshots map valid altars, discard invalid entries, and replace local plates',()=>{
 const apply=createWorldSnapshotApplier(),now=server-900000;
 const patch=apply(snapshot({fruitOfferings:[
  {altar:'temple',at:server-10000},{altar:'bodhi',at:server-20000},
  {altar:'quan-am',at:server-30000},{altar:'truc-lam',at:server-40000},
  {altar:'unknown',at:server-1},{altar:'temple',at:server+1},
 ]}),server,now);
 assert.deepEqual(patch.fruitOfferings,[
  {altar:'temple',at:now-10000},{altar:'bodhi',at:now-20000},
  {altar:'quan-am',at:now-30000},{altar:'truc-lam',at:now-40000},
 ]);
 const replacement=apply(snapshot({fruitOfferings:[{altar:'temple',at:server+1000}]}),server+1000,now+1000);
 assert.deepEqual(replacement.fruitOfferings,[{altar:'temple',at:now+1000}]);
});
