import {fetchDeadline} from './fetchDeadline';
import {setGardenTransport} from './gardenTransport';
import {createClientId} from './clientIds';
import {setOfferingTransport} from './offeringTransport';
import { useEffect } from 'react';
import { useGame, type ChatMessage, type Peer, type PlotState } from './gameStore';
let clientId='';
export function useSharedCourtyard(){const room=useGame(s=>s.room);useEffect(()=>{
  let source:EventSource|null=null,timer:ReturnType<typeof setInterval>|null=null,closed=false,lastOfferings='',lastPlots='';
  clientId=sessionStorage.getItem('sen-player-id')||createClientId();sessionStorage.setItem('sen-player-id',clientId);useGame.setState({playerId:clientId,connection:'connecting',peers:[],messages:[],chatUnread:0,plots:{},offerings:{flower:[],candle:[]},burningIncense:[],fishFeedAt:0,fishFeeds:[],offeringSlots:{}});
  const sendState=()=>{const s=useGame.getState();if(closed||s.room!==room||s.connection!=='online')return Promise.reject(new Error('Đang kết nối phòng, bạn đợi một chút nhé.'));return fetchDeadline('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:clientId,room,name:s.name,robe:s.robe,gender:s.gender,skin:s.skin,robeStyle:s.robeStyle,equipment:s.equipment,x:s.position[0],y:s.height,z:s.position[1],heading:s.heading,action:s.action,seat:s.seated,bow:s.action==='bow'&&s.bow?{...s.bow,elapsed:Math.max(0,Date.now()-s.bow.at)}:null,meal:s.meal})}).then(r=>{if(!r.ok)throw new Error('Chưa gửi được vị trí vào phòng.');})};
  const connect=async()=>{try{const check=await fetchDeadline('/api/health',{},3000);if(!check.ok||!check.headers.get('content-type')?.includes('application/json'))throw new Error('offline');if(closed)return;source=new EventSource(`/api/events?room=${encodeURIComponent(room)}&id=${encodeURIComponent(clientId)}`);
    source.addEventListener('snapshot',(event)=>{const data=JSON.parse((event as MessageEvent).data) as {serverTime?:number;peers:Peer[];messages:ChatMessage[];plots?:Record<string,PlotState>;offerings?:{kind:'incense'|'flower'|'candle'|'feed';at:number;station:string|null;x?:number;z?:number}[]};if(closed)return;const s=useGame.getState();const unread=data.messages.filter(m=>!s.messages.some(old=>old.id===m.id)&&m.name!==s.name&&!m.system).length;
      const me=data.peers.find(p=>p.id===clientId);if(me?.seat===null&&s.seated&&data.peers.some(p=>p.id!==clientId&&p.seat===s.seated)){s.stand();s.notify('Chỗ ngồi đã được chọn trước. Mời bạn chọn một chỗ khác.')}
      const offerings=data.offerings||[];
      const signature=JSON.stringify(offerings);
      const shared=signature===lastOfferings?{}:{fishFeeds:offerings.filter(o=>o.kind==='feed').map(o=>({at:o.at,x:o.x??22,z:o.z??6})),fishFeedAt:Math.max(0,...offerings.filter(o=>o.kind==='feed').map(o=>o.at)),offerings:{flower:offerings.filter(o=>o.kind==='flower').map(o=>o.at),candle:offerings.filter(o=>o.kind==='candle').map(o=>o.at)},burningIncense:offerings.filter(o=>o.kind==='incense').map(o=>o.at),offeringSlots:Object.fromEntries(offerings.filter(o=>o.station).map(o=>[o.at,o.station!]))};lastOfferings=signature;
      const plots=data.plots||{},plotSignature=JSON.stringify(plots),garden=plotSignature===lastPlots?{}:{plots};lastPlots=plotSignature;
      useGame.setState({...shared,...garden,connection:'online',peers:data.peers.filter(p=>p.id!==clientId).map(p=>({...p,bow:p.bow&&Number.isFinite(data.serverTime)?{...p.bow,at:Date.now()-Math.max(0,data.serverTime!-p.bow.at)}:null})),messages:data.messages,chatUnread:s.panel==='chat'?0:s.chatUnread+unread});});
    source.onerror=()=>{if(!closed)useGame.setState({connection:'offline',peers:[]})};
    void sendState().catch(()=>{});timer=setInterval(()=>void sendState().catch(()=>{}),350);
  }catch{if(!closed)useGame.setState({connection:'offline',peers:[]})}};
  setGardenTransport(async request=>{
    for(let attempt=0;attempt<2;attempt++){
      if(closed)throw new Error('Bạn đã chuyển phòng.');
      try{
        await sendState();
        const response=await fetchDeadline('/api/garden',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...request,id:clientId,room})});
        const data=await response.json();if(!response.ok)throw new Error(data.error||'Chưa chăm được cây.');return;
      }catch(error){if(attempt===1)throw error}
    }
  });
  setOfferingTransport(async request=>{
    for(let attempt=0;attempt<2;attempt++){
      if(closed)throw new Error('Bạn đã chuyển phòng.');
      try{
        await sendState();
        const response=await fetchDeadline('/api/offerings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...request,id:clientId,room})});
        if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(response.status===429?'Mời bạn đợi một chút rồi dâng tiếp.':data.error==='too far'||data.error==='approach an unobstructed pond edge'?'Mời bạn đến gần bàn lễ hoặc mép hồ rồi thử lại.':response.status===403?'Địa chỉ kết nối chưa khớp. Hãy tải lại trang LAN.':'Chưa gửi được lễ vật vào phòng.');}
        return;
      }catch(error){if(attempt===1)throw error}
    }
  });
  void connect();return()=>{closed=true;setGardenTransport(null);setOfferingTransport(null);source?.close();if(timer)clearInterval(timer);useGame.setState({peers:[]})};
},[room]);}
export async function sendChat(text:string){const s=useGame.getState();const clean=text.trim().slice(0,240);if(!clean)return false;if(s.connection!=='online'){s.notify('Chat cần kết nối tới máy chủ game đang chạy bằng Choi-Game.cmd.');return false;}try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:clientId,room:s.room,text:clean})});if(!r.ok)throw new Error();return true}catch{s.notify('Chưa gửi được lời nhắn. Thử lại sau một chút nhé.');return false}}
