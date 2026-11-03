import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const mime={'.glb':'model/gltf-binary','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const allowedRooms=new Set(['an-nhien','truc-lam','huong-sen']);
export function createGameServer(){
  const rooms=new Map();
  const roomFor=id=>{if(!rooms.has(id))rooms.set(id,{peers:new Map(),streams:new Map(),messages:[],lastChat:new Map()});return rooms.get(id)};
  const snapshot=room=>JSON.stringify({peers:[...room.peers.values()].map(p=>{const {updated,...safe}=p;return safe}),messages:room.messages});
  const emit=room=>{const data=`event: snapshot\ndata: ${snapshot(room)}\n\n`;for(const res of room.streams.values())res.write(data)};
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
  async function body(req){let value='';for await(const chunk of req){value+=chunk;if(value.length>8192)throw new Error('too large')}return JSON.parse(value)}
  const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(id);
  const server=createServer(async(req,res)=>{
    try{
      const url=new URL(req.url||'/','http://localhost'),pathname=decodeURIComponent(url.pathname);
      if(pathname==='/api/health'){json(res,200,{ok:true,version:3,rooms:[...allowedRooms]});return;}
      if(pathname==='/api/events'&&req.method==='GET'){
        const roomId=url.searchParams.get('room'),id=url.searchParams.get('id');if(!allowedRooms.has(roomId)||!validId(id)){json(res,400,{error:'invalid room or id'});return;}
        const room=roomFor(roomId);if(room.peers.size>=16&&!room.peers.has(id)){json(res,429,{error:'room full'});return;}
        const old=room.streams.get(id);if(old)old.end();
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': Sen An Nhien\n\n');
        room.streams.set(id,res);room.peers.set(id,{id,name:'Người hữu duyên',robe:'#bf733e',x:0,y:.06,z:26,heading:Math.PI,action:'walk',seat:null,meal:null,updated:Date.now()});emit(room);
        req.on('close',()=>{if(room.streams.get(id)===res){room.streams.delete(id);room.peers.delete(id);room.lastChat.delete(id);emit(room)}});return;
      }
      if(pathname.startsWith('/api/')&&req.method==='POST'){
        const origin=req.headers.origin;if(origin){const parsed=new URL(origin);if(!['127.0.0.1','localhost'].includes(parsed.hostname)){json(res,403,{error:'local origin required'});return;}}
        const b=await body(req);if(!allowedRooms.has(b.room)||!validId(b.id)){json(res,400,{error:'invalid player'});return;}
        const room=roomFor(b.room),peer=room.peers.get(b.id);if(!peer){json(res,409,{error:'connect to room first'});return;}
        if(pathname==='/api/state'){
          const finite=(n,min,max,fallback)=>typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
          const seat=typeof b.seat==='string'&&b.seat.length<40&&!([...room.peers.values()].some(p=>p.id!==b.id&&p.seat===b.seat))?b.seat:null;
          const actions=['flower','candle','incense','walk','sit','eat','pray','bow','sweep','meditate','beads','chant','mok'];
          const meal=b.meal&&['noodles','rice','soup','bread'].includes(b.meal.dish)&&['preparing','ready','eating','finished'].includes(b.meal.status)&&typeof b.meal.seatId==='string'?{dish:b.meal.dish,seatId:b.meal.seatId.slice(0,40),status:b.meal.status,readyAt:finite(b.meal.readyAt,0,Date.now()+60000,0),eatUntil:finite(b.meal.eatUntil,0,Date.now()+60000,0)}:null;
          room.peers.set(b.id,{...peer,name:typeof b.name==='string'?b.name.trim().slice(0,22)||'An Nhiên':peer.name,robe:typeof b.robe==='string'&&/^#[a-fA-F0-9]{6}$/.test(b.robe)?b.robe:peer.robe,gender:b.gender==='female'?'female':'male',skin:typeof b.skin==='string'&&/^#[a-fA-F0-9]{6}$/.test(b.skin)?b.skin:'#c99c79',robeStyle:b.robeStyle==='cross'?'cross':'traditional',x:finite(b.x,-60,60,peer.x),y:finite(b.y,-1,12,peer.y),z:finite(b.z,-66,62,peer.z),heading:finite(b.heading,-100,100,peer.heading),action:actions.includes(b.action)?b.action:'walk',seat,meal,updated:Date.now()});json(res,200,{ok:true,seat});return;
        }
        if(pathname==='/api/chat'){
          if(Date.now()-(room.lastChat.get(b.id)||0)<1000){json(res,429,{error:'slow down'});return;}
          const text=typeof b.text==='string'?b.text.trim().slice(0,240):'';if(!text){json(res,400,{error:'empty message'});return;}
          room.lastChat.set(b.id,Date.now());room.messages.push({id:randomUUID(),name:peer.name,text,at:Date.now()});room.messages=room.messages.slice(-80);emit(room);json(res,200,{ok:true});return;
        }
        json(res,404,{error:'unknown endpoint'});return;
      }
      if(pathname.startsWith('/api/')){json(res,404,{error:'unknown endpoint'});return;}
      if(!['GET','HEAD'].includes(req.method||'')){res.writeHead(405);res.end();return;}
      let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
      const info=await stat(file).catch(()=>null);if(info?.isDirectory())file=path.join(file,'index.html');if(!info){if(path.extname(pathname)){res.writeHead(404);res.end();return;}file=path.join(root,'index.html')}
      const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':path.extname(file)==='.html'?'no-store':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:content);
    }catch{if(!res.headersSent)json(res,400,{error:'invalid request'});else res.end()}
  });
  const broadcast=setInterval(()=>{for(const room of rooms.values()){for(const [id,p] of room.peers){if(Date.now()-p.updated>90000){room.streams.get(id)?.end();room.streams.delete(id);room.peers.delete(id)}}if(room.streams.size)emit(room)}},350);broadcast.unref();
  server.on('close',()=>{clearInterval(broadcast);for(const room of rooms.values())for(const res of room.streams.values())res.end()});
  return server;
}
export function startGameServer(){
  const port=Number(process.env.PORT||5174),server=createGameServer();server.on('error',e=>{console.error(`Khong mo duoc cong ${port}: ${e.message}`);process.exitCode=1});
  server.listen(port,'127.0.0.1',()=>console.log(`\n  SEN AN NHIEN · KHUON VIEN MO RONG\n  http://127.0.0.1:${port}\n  13 khu vuc · 94 cho ngoi · 4 mon chay\n  Phong + chat: mo cung dia chi trong cua so khac.\n  Giu cua so nay de choi. Ctrl+C de dung.\n`));
  return server;
}
