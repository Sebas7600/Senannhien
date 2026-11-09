import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createGameServer} from '../server-runtime.mjs';
import {feedStations,QUAN_AM_SPOT,ISLAND} from '../src/pondScene.mjs';
function stream(base,id,room='an-nhien'){
  let state={peers:[],messages:[]},request,buffer='',listeners=[];
  const opened=new Promise((resolve,reject)=>{request=http.get(`${base}/api/events?id=${id}&room=${room}`,res=>{assert.equal(res.statusCode,200);res.setEncoding('utf8');res.on('data',chunk=>{buffer+=chunk;let i;while((i=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,i);buffer=buffer.slice(i+2);const data=frame.split('\n').find(l=>l.startsWith('data: '));if(data){state=JSON.parse(data.slice(6));resolve();listeners.forEach(fn=>fn());}}});res.on('error',()=>{})});request.on('error',reject)});
  return {opened,get state(){return state},close(){request.destroy()},wait(predicate){if(predicate(state))return Promise.resolve();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('snapshot timeout')),3000);const fn=()=>{if(predicate(state)){clearTimeout(timer);listeners=listeners.filter(f=>f!==fn);resolve();}};listeners.push(fn);})}};
}
test('shared courtyard: live positions, room separation, exclusive seats and chat delivery',async()=>{
  const server=createGameServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;const all=[];
  const post=async(route,data)=>{const res=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:res.status,data:await res.json()}};
  try{
    const health=await (await fetch(base+'/api/health')).json();assert.equal(health.version,3);
    const a=stream(base,'test_player_a'),b=stream(base,'test_player_b'),other=stream(base,'test_player_c','truc-lam');all.push(a,b,other);await Promise.all(all.map(c=>c.opened));await a.wait(s=>s.peers.length===2);
    const first=await post('/api/state',{id:'test_player_a',room:'an-nhien',name:'An',robe:'#bf733e',gender:'female',skin:'#b58a66',robeStyle:'cross',x:28.2,y:.53,z:-29,heading:1.5,action:'sit',seat:'dining-0'});assert.equal(first.status,200);assert.equal(first.data.seat,'dining-0');
    const conflict=await post('/api/state',{id:'test_player_b',room:'an-nhien',name:'Bình',x:3,z:4,action:'sit',seat:'dining-0'});assert.equal(conflict.data.seat,null);
    await b.wait(s=>s.peers.some(p=>p.name==='An'&&p.x===28.2&&p.seat==='dining-0'));assert.equal(other.state.peers.length,1);assert.equal(b.state.peers.find(p=>p.name==='An').gender,'female');assert.equal(b.state.peers.find(p=>p.name==='An').robeStyle,'cross');
    const message=await post('/api/chat',{id:'test_player_a',room:'an-nhien',text:'Chào bạn, mời dùng bữa chay.'});assert.equal(message.status,200);await b.wait(s=>s.messages.some(m=>m.text==='Chào bạn, mời dùng bữa chay.'));assert.equal(other.state.messages.length,0);
    const duplicate=await post('/api/chat',{id:'test_player_a',room:'an-nhien',text:'spam'});assert.equal(duplicate.status,429);
    const forged=await post('/api/chat',{id:'not_connected',room:'an-nhien',text:'hello'});assert.equal(forged.status,409);
    const kitchenAt=Date.now(),meal={dish:'rice',seatId:'dining-0',status:'preparing',orderedAt:kitchenAt,cookedAt:kitchenAt+3000,counterReadyAt:kitchenAt+9000,kitchenAt:kitchenAt+5000,deliveryAt:kitchenAt+10150,readyAt:kitchenAt+18000,homeAt:kitchenAt+24000};
    await post('/api/state',{id:'test_player_a',room:'an-nhien',action:'sit',seat:'dining-0',meal});await b.wait(s=>s.peers.some(p=>p.id==='test_player_a'&&p.meal?.counterReadyAt===meal.counterReadyAt));
    const {counterReadyAt,...legacyMeal}=meal;await post('/api/state',{id:'test_player_a',room:'an-nhien',meal:legacyMeal});await b.wait(s=>s.peers.some(p=>p.id==='test_player_a'&&p.meal&&!('counterReadyAt' in p.meal)));
    for(const [action,seat] of [['read','reading-19'],['tea','tea-19'],['drawWater',null],['carryWater',null],['pourWater',null]]){
      await post('/api/state',{id:'test_player_a',room:'an-nhien',action,seat});
      await b.wait(s=>s.peers.some(p=>p.id==='test_player_a'&&p.action===action&&p.seat===seat));
    }
    a.close();await b.wait(s=>s.peers.length===1);assert.equal(b.state.peers[0].id,'test_player_b');
  }finally{all.forEach(c=>c.close());server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('production server sends explicit media types for mobile audio and painting assets',async()=>{
  const server=createGameServer(),tag=randomUUID(),files=[];
  await mkdir(new URL('../dist/audio/',import.meta.url),{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    for(const [extension,type,magic] of [['mp3','audio/mpeg','ID3'],['wav','audio/wav','RIFF'],['webp','image/webp','RIFF']]){
      const filename=`audio/qa-${tag}.${extension}`,file=new URL(`../dist/${filename}`,import.meta.url);files.push(file);await writeFile(file,magic,{flag:'wx'});
      const response=await fetch(`http://127.0.0.1:${server.address().port}/${filename}`);
      assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),type);assert.equal(await response.text(),magic);
      if(type.startsWith('audio/')){
        const url=`http://127.0.0.1:${server.address().port}/${filename}`;
        const range=await fetch(url,{headers:{Range:'bytes=0-1'}});assert.equal(range.status,206);assert.equal(range.headers.get('content-range'),`bytes 0-1/${magic.length}`);assert.equal(await range.text(),magic.slice(0,2));
        const suffix=await fetch(url,{headers:{Range:'bytes=-2'}});assert.equal(suffix.status,206);assert.equal(await suffix.text(),magic.slice(-2));
        const invalid=await fetch(url,{headers:{Range:'bytes=999-'}});assert.equal(invalid.status,416);assert.equal(invalid.headers.get('content-range'),`bytes */${magic.length}`);
        const head=await fetch(url,{method:'HEAD',headers:{Range:'bytes=0-1'}});assert.equal(head.status,206);assert.equal(head.headers.get('content-length'),'2');assert.equal(await head.text(),'');
      }
    }
  }finally{await Promise.all(files.map(file=>unlink(file)));server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('Quan Am incense stays at its altar, reaches late joiners, rejects remote/invalid requests and expires',async()=>{
 let clock=Date.now();const server=createGameServer({now:()=>clock});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,all=[];
 const post=async(route,data)=>{const res=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'quan_am_test_a',room:'an-nhien',...data})});return res.status};
 try{const a=stream(base,'quan_am_test_a'),other=stream(base,'quan_am_test_other','truc-lam');all.push(a,other);await Promise.all(all.map(s=>s.opened));
  assert.equal(await post('/api/offerings',{kind:'incense',station:'quan-am',operation:'quan_am_remote'}),409);
  await post('/api/state',{x:QUAN_AM_SPOT[0],y:ISLAND.top,z:QUAN_AM_SPOT[1],action:'incense'});
  assert.equal(await post('/api/offerings',{kind:'incense',station:'wrong-altar',operation:'quan_am_invalid'}),400);
  assert.equal(await post('/api/offerings',{kind:'incense',station:'quan-am',operation:'quan_am_valid'}),200);
  assert.equal(await post('/api/offerings',{kind:'incense',station:'quan-am',operation:'quan_am_valid'}),200);
  await a.wait(s=>s.offerings.length===1);assert.equal(a.state.offerings[0].station,'quan-am');assert.equal(other.state.offerings.length,0);
  const late=stream(base,'quan_am_test_late');all.push(late);await late.opened;assert.equal(late.state.offerings.length,1);assert.equal(late.state.offerings[0].station,'quan-am');
  clock+=3000;await post('/api/state',{x:0,z:-7.1});assert.equal(await post('/api/offerings',{kind:'incense',operation:'temple_after_quan_am'}),200);await late.wait(s=>s.offerings.length===2);assert.equal(late.state.offerings.find(o=>o.station===null)?.kind,'incense');
  clock+=650001;await late.wait(s=>s.offerings.length===0);
 }finally{all.forEach(c=>c.close());server.closeAllConnections();await new Promise(r=>server.close(r))}
});
test('room offerings: all kinds, late join, isolation, deduplication, capacity and expiry',async()=>{
 let clock=Date.now();const server=createGameServer({now:()=>clock});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,all=[];
 const post=async(route,data)=>{const res=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'offer_player_a',room:'an-nhien',...data})});return res.status};
 try{
  const a=stream(base,'offer_player_a'),b=stream(base,'offer_player_b'),other=stream(base,'offer_player_c','truc-lam');all.push(a,b,other);await Promise.all(all.map(c=>c.opened));
  assert.equal(await post('/api/offerings',{kind:'incense',operation:'incense_0001'}),409);
  await post('/api/state',{x:0,z:-7.1});
  assert.equal(await post('/api/offerings',{kind:'incense',operation:'incense_0001'}),200);
  assert.equal(await post('/api/offerings',{kind:'incense',operation:'incense_0001'}),200);
  await b.wait(s=>s.offerings.length===1);assert.equal(b.state.offerings[0].kind,'incense');assert.equal(other.state.offerings.length,0);
  clock+=3000;await post('/api/state',{x:-3.7,z:-28});
  assert.equal(await post('/api/offerings',{kind:'flower',station:'flower-front-0',operation:'flower_bad01'}),400);
  assert.equal(await post('/api/offerings',{kind:'flower',station:'flower-table-1',operation:'flower_00001'}),200);
  clock+=3000;await post('/api/state',{x:4.7,z:-28});
  assert.equal(await post('/api/offerings',{kind:'candle',station:'candle-table-2',operation:'candle_00001'}),200);
  const late=stream(base,'offer_player_late');all.push(late);await late.opened;assert.deepEqual(late.state.offerings.map(o=>o.kind),['incense','flower','candle']);
  for(let i=2;i<=8;i++){clock+=3000;assert.equal(await post('/api/offerings',{kind:'candle',station:'candle-table-2',operation:'candle_0000'+i}),200)}
  clock+=3000;assert.equal(await post('/api/offerings',{kind:'candle',station:'candle-table-2',operation:'candle_full1'}),409);
  const station=feedStations.find(item=>item.id==='shore-6');
  clock+=3000;await post('/api/state',{x:station.spot[0],z:station.spot[1]});assert.equal(await post('/api/offerings',{kind:'feed',station:station.id,operation:'feeding_0001'}),200);await b.wait(s=>s.offerings.some(o=>o.kind==='feed'));assert.equal(other.state.offerings.length,0);
  clock+=12001;await b.wait(s=>!s.offerings.some(o=>o.kind==='feed'));
  clock+=480001;await b.wait(s=>s.offerings.length===1);assert.equal(b.state.offerings[0].kind,'incense');
  clock+=170000;await b.wait(s=>s.offerings.length===0);
 }finally{all.forEach(c=>c.close());server.closeAllConnections();await new Promise(r=>server.close(r))}
});

test('shared garden: room isolation, late join, stale actions, one harvest and retry deduplication',async()=>{
 let clock=Date.now();const server=createGameServer({now:()=>clock});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,all=[];
 const post=async(route,id,data)=>{const res=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,room:'an-nhien',...data})});return res.status};
 try{
  const a=stream(base,'garden_player_a'),b=stream(base,'garden_player_b'),other=stream(base,'garden_player_c','truc-lam');all.push(a,b,other);await Promise.all(all.map(c=>c.opened));
  const seed={plot:'plot-0',action:'plant',revision:0,operation:'garden_seed01'};
  assert.equal(await post('/api/garden','garden_player_a',seed),409);
  await Promise.all(['garden_player_a','garden_player_b'].map(id=>post('/api/state',id,{x:31,z:-51.5})));
  assert.equal(await post('/api/garden','garden_player_a',{...seed,plot:'plot-99'}),400);
  const planted=await Promise.all([post('/api/garden','garden_player_a',seed),post('/api/garden','garden_player_b',{...seed,operation:'garden_seed02'})]);assert.deepEqual(planted.sort(),[200,409]);
  await b.wait(s=>s.plots['plot-0']?.revision===1);assert.deepEqual(other.state.plots,{});
  assert.equal(await post('/api/garden','garden_player_a',{plot:'plot-0',action:'harvest',revision:1,operation:'early_harvest'}),409);
  assert.equal(await post('/api/garden','garden_player_a',{plot:'plot-0',action:'water',revision:1,operation:'garden_water1'}),200);
  const late=stream(base,'garden_player_late');all.push(late);await late.opened;assert.equal(late.state.plots['plot-0'].revision,2);assert.equal(late.state.plots['plot-0'].wateredAt,clock);
  clock+=60001;
  const harvest={plot:'plot-0',action:'harvest',revision:2,operation:'garden_pick01'};
  const results=await Promise.all([post('/api/garden','garden_player_a',harvest),post('/api/garden','garden_player_b',{...harvest,operation:'garden_pick02'})]);assert.deepEqual([...results].sort(),[200,409]);
  await a.wait(s=>s.plots['plot-0']?.harvested);assert.equal(a.state.plots['plot-0'].revision,3);
  // Replaying the winning operation must acknowledge without re-harvesting or replanting.
  const winner=results[0]===200?'garden_player_a':'garden_player_b';
  assert.equal(await post('/api/garden',winner,{...harvest,operation:winner==='garden_player_a'?'garden_pick01':'garden_pick02'}),200);
  assert.equal(await post('/api/garden','garden_player_a',{plot:'plot-0',action:'plant',revision:3,operation:'garden_seed03'}),200);
  await b.wait(s=>s.plots['plot-0']?.revision===4);assert.equal(b.state.plots['plot-0'].harvested,false);
 }finally{all.forEach(c=>c.close());server.closeAllConnections();await new Promise(r=>server.close(r))}

});
