import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const mime={'.glb':'model/gltf-binary','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.woff2':'font/woff2'};
const allowedRooms=new Set(['an-nhien','truc-lam','huong-sen']);
export function createGameServer({now=Date.now}={}){
  const rooms=new Map();
  const roomFor=id=>{if(!rooms.has(id))rooms.set(id,{peers:new Map(),streams:new Map(),messages:[],lastChat:new Map(),offerings:[],operations:new Map(),lastOffering:new Map(),plots:{},gardenOperations:new Map()});return rooms.get(id)};
  const prune=room=>{room.offerings=room.offerings.filter(o=>now()-o.at<(o.kind==='feed'?12000:o.kind==='incense'?650000:480000));for(const [key,at] of room.operations)if(now()-at>650000)room.operations.delete(key)};
  const snapshot=room=>{prune(room);return JSON.stringify({offerings:room.offerings,plots:room.plots,peers:[...room.peers.values()].map(p=>{const {updated,...safe}=p;return safe}),messages:room.messages})};
  const emit=room=>{const data=`event: snapshot\ndata: ${snapshot(room)}\n\n`;for(const res of room.streams.values())if(!res.writableEnded&&!res.destroyed)res.write(data)};
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
          const actions=['drawWater','carryWater','pourWater','plant','water','harvest','feed','flower','candle','incense','walk','sit','eat','pray','bow','sweep','meditate','beads','chant','mok','read','tea'];
          const meal=b.meal&&['noodles','rice','soup','bread'].includes(b.meal.dish)&&['preparing','ready','eating','finished'].includes(b.meal.status)&&typeof b.meal.seatId==='string'?{dish:b.meal.dish,seatId:b.meal.seatId.slice(0,40),status:b.meal.status,orderedAt:finite(b.meal.orderedAt,0,Date.now()+60000,0),cookedAt:finite(b.meal.cookedAt,0,Date.now()+60000,0),kitchenAt:finite(b.meal.kitchenAt,0,Date.now()+60000,0),deliveryAt:finite(b.meal.deliveryAt,0,Date.now()+60000,0),homeAt:finite(b.meal.homeAt,0,Date.now()+60000,0),readyAt:finite(b.meal.readyAt,0,Date.now()+60000,0),eatUntil:finite(b.meal.eatUntil,0,Date.now()+60000,0)}:null;

          room.peers.set(b.id,{...peer,name:typeof b.name==='string'?b.name.trim().slice(0,22)||'An Nhiên':peer.name,robe:typeof b.robe==='string'&&/^#[a-fA-F0-9]{6}$/.test(b.robe)?b.robe:peer.robe,gender:b.gender==='female'?'female':'male',skin:typeof b.skin==='string'&&/^#[a-fA-F0-9]{6}$/.test(b.skin)?b.skin:'#c99c79',robeStyle:b.robeStyle==='cross'?'cross':'traditional',x:finite(b.x,-60,60,peer.x),y:finite(b.y,-1,12,peer.y),z:finite(b.z,-66,62,peer.z),heading:finite(b.heading,-100,100,peer.heading),action:actions.includes(b.action)?b.action:'walk',seat,meal,updated:Date.now()});json(res,200,{ok:true,seat});return;
        }
        if(pathname==='/api/garden'){
          if(!validId(b.operation)||!/^plot-([0-9]|1[01])$/.test(b.plot)||!['plant','water','harvest'].includes(b.action)||!Number.isInteger(b.revision)){json(res,400,{error:'Yêu cầu chăm cây không hợp lệ.'});return;}
          const key=b.id+':'+b.operation;
          if(room.gardenOperations.has(key)){json(res,200,{ok:true});return;}
          const index=Number(b.plot.slice(5)),x=31+index%4*3.1,z=-53+Math.floor(index/4)*3.1;
          if(Math.hypot(peer.x-x,peer.z-z)>3.3){json(res,409,{error:'Đến gần luống rau rồi thử lại nhé.'});return;}
          const p=room.plots[b.plot],revision=p?.revision??0;
          if(b.revision!==revision){json(res,409,{error:'Luống này vừa được người khác chăm. Bạn xem trạng thái mới rồi thử lại nhé.'});return;}
          const action=!p||p.harvested?'plant':p.wateredAt===null?'water':now()-p.wateredAt>=60000?'harvest':null;
          if(b.action!==action){json(res,409,{error:action?'Trạng thái cây đã thay đổi. Bạn thử lại nhé.':'Cây đang lớn, bạn chờ thêm một chút nhé.'});return;}
          room.plots[b.plot]=action==='plant'?{plantedAt:now(),wateredAt:null,harvested:false,revision:revision+1,by:peer.name}:{...p,...(action==='water'?{wateredAt:now()}:{harvested:true}),revision:revision+1,by:peer.name};
          room.gardenOperations.set(key,now());for(const [id,at]of room.gardenOperations)if(now()-at>600000)room.gardenOperations.delete(id);
          emit(room);json(res,200,{ok:true});return;
        }
        if(pathname==='/api/offerings'){

          prune(room);
          if(!validId(b.operation)||!['incense','flower','candle','feed'].includes(b.kind)){json(res,400,{error:'invalid offering'});return;}
          const key=b.id+':'+b.operation;
          if(room.operations.has(key)){json(res,200,{ok:true});return;}
          let spot=[0,-8.7],target=[22,6];if(b.kind==='incense'&&b.station){if(b.station!=='quan-am'){json(res,400,{error:'invalid station'});return;}spot=[39.35,25.25];}
          if(b.kind==='feed'){
            const stations=[...Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return {id:'shore-'+i,spot:[33+Math.cos(a)*9.4,9+Math.sin(a)*11.9],target:[33+Math.cos(a)*7.1,9+Math.sin(a)*9.3]}}),...[-5,0,5].flatMap((x,i)=>[-1,1].map(side=>({id:'bridge-'+i+'-'+(side+1),spot:[33+x,9+side*.85],target:[33+x,9+side*3]})))];
            const station=stations.find(s=>s.id===b.station);if(!station){json(res,400,{error:'invalid station'});return;}spot=station.spot;target=station.target;
          }
          const xs={flower:{table:[-5.7,-3.7,-1,1,3.7,5.7],floor:[-6.575,-2.825,-1.875,1.875,2.825,6.575],low:[-.76,.76]},candle:{table:[-4.7,0,4.7]}};
          if(b.kind!=='incense'&&b.kind!=='feed'){
            const match=typeof b.station==='string'&&b.station.match(/^(flower|candle)-(table|floor|low)-(\d)$/);
            const x=match&&match[1]===b.kind?xs[b.kind][match[2]]?.[Number(match[3])]:undefined;
            if(x===undefined){json(res,400,{error:'invalid station'});return;}
            spot=[x,match[2]==='low'?-28.425:-29.5];
          }
          if(Math.hypot(peer.x-spot[0],peer.z-spot[1])>(b.kind==='feed'?2.8:b.kind==='incense'?2.3:2.1)){json(res,409,{error:'too far'});return;}
          if(now()-(room.lastOffering.get(b.id)??-Infinity)<2500){json(res,429,{error:'slow down'});return;}
          if(b.kind!=='incense'&&b.kind!=='feed'&&room.offerings.filter(o=>o.kind===b.kind&&o.station===b.station).length>=8){json(res,409,{error:'station full'});return;}
          const at=Math.max(now(),...room.offerings.map(o=>o.at+1));
          room.offerings.push({kind:b.kind,station:b.kind==='incense'?(b.station||null):b.station,at,...(b.kind==='feed'?{x:target[0],z:target[1]}:{})});
          const feed=room.offerings.filter(o=>o.kind==='feed');if(feed.length>12){const removed=new Set(feed.slice(0,-12));room.offerings=room.offerings.filter(o=>!removed.has(o));}
          const incense=room.offerings.filter(o=>o.kind==='incense');
          if(incense.length>72){const removed=new Set(incense.slice(0,-72));room.offerings=room.offerings.filter(o=>!removed.has(o));}
          room.operations.set(key,now());room.lastOffering.set(b.id,now());emit(room);json(res,200,{ok:true});return;
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
      const content=await readFile(file),extension=path.extname(file);
      const headers={'Content-Type':mime[extension]||'application/octet-stream','Content-Length':content.length,'X-Content-Type-Options':'nosniff','Cache-Control':extension==='.html'?'no-store':'public, max-age=3600'};
      if(['.mp3','.wav','.ogg'].includes(extension)){
        headers['Accept-Ranges']='bytes';
        if(req.headers.range){
          const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
          let start=0,end=content.length-1;
          if(match&&(match[1]||match[2])){
            if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
            else start=Math.max(0,content.length-Number(match[2]));
          }else start=content.length;
          if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=content.length){
            res.writeHead(416,{'Content-Range':`bytes */${content.length}`,'Content-Length':0});res.end();return;
          }
          const part=content.subarray(start,end+1);res.writeHead(206,{...headers,'Content-Length':part.length,'Content-Range':`bytes ${start}-${end}/${content.length}`});res.end(req.method==='HEAD'?undefined:part);return;
        }
      }
      res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:content);
    }catch{if(!res.headersSent)json(res,400,{error:'invalid request'});else res.end()}
  });
  const broadcast=setInterval(()=>{for(const room of rooms.values()){for(const [id,p] of room.peers){if(Date.now()-p.updated>90000){room.streams.get(id)?.end();room.streams.delete(id);room.peers.delete(id)}}if(room.streams.size)emit(room)}},350);broadcast.unref();
  server.on('close',()=>{clearInterval(broadcast);for(const room of rooms.values())for(const res of room.streams.values())res.end()});
  return server;
}
export function startGameServer(){
  const port=Number(process.env.PORT||5174),server=createGameServer();server.on('error',e=>{console.error(`Khong mo duoc cong ${port}: ${e.message}`);process.exitCode=1});
  server.listen(port,'127.0.0.1',()=>console.log(`\n  SEN AN NHIEN · KHUON VIEN MO RONG\n  http://127.0.0.1:${port}\n  13 khu vuc · 146 cho ngoi · 4 mon chay\n  Phong + chat: mo cung dia chi trong cua so khac.\n  Giu cua so nay de choi. Ctrl+C de dung.\n`));

  return server;
}
