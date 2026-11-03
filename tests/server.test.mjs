import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createGameServer} from '../server-runtime.mjs';
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
    for(const [action,seat] of [['read','reading-19'],['tea','tea-19']]){
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
