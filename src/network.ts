import {useEffect} from 'react';
import {setWorldTransport,setSweepTransport} from './worldTransport';
import {createWorldSnapshotApplier,type WorldSnapshot} from './worldSnapshot';
import {FISH_COUNT} from './fishSimulation.mjs';
import {fetchDeadline} from './fetchDeadline';
import {setGardenTransport} from './gardenTransport';
import {setOfferingTransport} from './offeringTransport';
import {createCourtyardConnection,createPageIdentity,retryNetworkOperation} from './courtyardConnection';
import {createRoomSnapshotApplier,localPeerMeal,mealTimingDeltas,type SharedOffering} from './networkSnapshot';
import {useGame,type ChatMessage,type Peer,type PlotState} from './gameStore';

const {id:clientId}=createPageIdentity();
interface CourtyardSnapshot {
  serverTime?:number;world?:WorldSnapshot;fish?:{at:number;seconds:number;poses:number[]};
  peers:Peer[];messages:ChatMessage[];plots?:Record<string,PlotState>;offerings?:SharedOffering[];
}

export function useSharedCourtyard(){
  const room=useGame(s=>s.room);
  useEffect(()=>{
    const applyWorld=createWorldSnapshotApplier(),applyRoom=createRoomSnapshotApplier();
    let closed=false,staleServerNotified=false;
    useGame.setState({roomSync:true,playerId:clientId,connection:'connecting',peers:[],roomMeals:[],messages:[],chatUnread:0,plots:{},offerings:{flower:[],candle:[]},burningIncense:[],fishFeedAt:0,fishFeeds:[],sharedFish:null,sharedWorld:null,worldBellAt:0,worldBellReadyAt:0,worldDrumAt:0,ceremony:null,event:null,flights:[],waterJars:[],offeringSlots:{},offeringServerTimes:{},fireworksShow:null,fruitOfferings:[]});

    const sendState=async()=>{
      const s=useGame.getState();
      if(closed||s.room!==room||s.connection!=='online')throw new Error('Đang kết nối phòng, bạn đợi một chút nhé.');
      const now=Date.now();
      const response=await fetchDeadline('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:clientId,room,name:s.name,robe:s.robe,gender:s.gender,skin:s.skin,robeStyle:s.robeStyle,equipment:s.equipment,x:s.position[0],y:s.height,z:s.position[1],heading:s.heading,action:s.action,seat:s.seated,bow:s.action==='bow'&&s.bow?{...s.bow,elapsed:Math.max(0,now-s.bow.at)}:null,meal:s.meal,mealTiming:mealTimingDeltas(s.meal,now)})});
      if(!response.ok)throw new Error('Chưa gửi được vị trí vào phòng.');
    };
    const connection=createCourtyardConnection({
      health:async()=>{
        const response=await fetchDeadline('/api/health',{},3000);
        if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('offline');
        const health=await response.json();
        if(!Number.isFinite(health.version)||health.version<4){
          if(!closed&&!staleServerNotified){staleServerNotified=true;useGame.getState().notify('Máy chủ LAN đang dùng bản cũ. Đóng cửa sổ CMD cũ và mở lại Choi-Game.cmd.');}
          throw new Error('old server');
        }
      },
      openSource:()=>new EventSource(`/api/events?room=${encodeURIComponent(room)}&id=${encodeURIComponent(clientId)}`),
      sendState,
      onStatus:status=>{if(!closed&&useGame.getState().room===room)useGame.setState({connection:status,...(status==='offline'?{peers:[],roomMeals:[]}:{} )});},
      onSnapshot:(raw,authoritative)=>{
        if(closed||useGame.getState().room!==room)return;
        const data=JSON.parse(raw) as CourtyardSnapshot,now=Date.now(),serverTime=Number.isFinite(data.serverTime)?data.serverTime!:now;
        const s=useGame.getState(),messages=data.messages??[],peers=data.peers??[];
        const unread=messages.filter(m=>!s.messages.some(old=>old.id===m.id)&&m.name!==s.name&&!m.system).length;
        const me=peers.find(p=>p.id===clientId);
        if(me?.seat===null&&s.seated&&peers.some(p=>p.id!==clientId&&p.seat===s.seated)){
          s.stand();s.notify('Chỗ ngồi đã được chọn trước. Mời bạn chọn một chỗ khác.');
        }
        useGame.setState({
          ...applyRoom(data.offerings??[],data.plots??{},serverTime,now,authoritative),
          ...(data.world?applyWorld(data.world,serverTime):{}),
          ...(data.fish&&data.fish.poses.length===FISH_COUNT*3&&data.fish.poses.every(Number.isFinite)?{sharedFish:{...data.fish,receivedAt:now}}:{}),
          peers:peers.filter(p=>p.id!==clientId).map(p=>({...p,actionAt:p.actionAt===undefined?undefined:p.actionAt+now-serverTime,bow:p.bow?{...p.bow,at:now-Math.max(0,serverTime-p.bow.at)}:null,meal:localPeerMeal(p.meal,serverTime,now)})),
          roomMeals:peers.flatMap(p=>{const meal=localPeerMeal(p.meal,serverTime,now);return meal?[meal]:[];}),
          messages,chatUnread:s.panel==='chat'?0:s.chatUnread+unread,
        });
      },
    });

    const sendWorld=(path:string,request:object,errorMessage='Chưa gửi được hoạt động.')=>retryNetworkOperation(async()=>{
      if(closed)throw new Error('Bạn đã chuyển phòng.');
      await sendState();
      if(closed||useGame.getState().room!==room)throw new Error('Bạn đã chuyển phòng.');
      const response=await fetchDeadline(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...request,id:clientId,room})});
      const data=await response.json().catch(error=>{if(response.ok)throw error;return {};});
      if(!response.ok){
        if(path==='/api/offerings')throw new Error(response.status===429?'Mời bạn đợi một chút rồi dâng tiếp.':data.error==='too far'||data.error==='approach an unobstructed pond edge'?'Mời bạn đến gần bàn lễ hoặc mép hồ rồi thử lại.':response.status===403?'Địa chỉ kết nối chưa khớp. Hãy tải lại trang LAN.':errorMessage);
        throw new Error(data.error||errorMessage);
      }
      return data;
    });
    setWorldTransport(request=>sendWorld('/api/world',request));
    setSweepTransport(async request=>(await sendWorld('/api/sweep',request)).count);
    setGardenTransport(async request=>{await sendWorld('/api/garden',request,'Chưa chăm được cây.');});
    setOfferingTransport(async request=>{await sendWorld('/api/offerings',request,'Chưa gửi được lễ vật vào phòng.');});
    connection.start();
    return ()=>{
      closed=true;connection.close();
      setWorldTransport(null);setSweepTransport(null);setGardenTransport(null);setOfferingTransport(null);
      useGame.setState({roomSync:false,connection:'offline',peers:[],roomMeals:[]});
    };
  },[room]);
}

export async function sendChat(text:string){
  const s=useGame.getState(),clean=text.trim().slice(0,240);if(!clean)return false;
  if(s.connection!=='online'){s.notify('Chat cần kết nối tới máy chủ game đang chạy bằng Choi-Game.cmd.');return false;}
  try{
    const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:clientId,room:s.room,text:clean})});
    if(!response.ok)throw new Error();return true;
  }catch{s.notify('Chưa gửi được lời nhắn. Thử lại sau một chút nhé.');return false;}
}
