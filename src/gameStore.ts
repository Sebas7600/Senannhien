import {QUAN_AM,nearQuanAm} from './quanAmData';
import {createWaterQuestActions} from './waterQuestActions';
import {emptyWaterJars,WATER_TASK,type WaterQuest,type WaterJarState} from './waterTaskData';
import {submitGarden,type GardenAction} from './gardenTransport';
import {nearestFeedStation,bridgeHeight} from './pondLayout';
import {offeringPending,submitOffering,type SharedOfferingKind} from './offeringTransport';
import {donationChest,nearDonationChest,nearestOfferingStation,offeringStation,offeringCount,templeSurfaceHeight} from './templeFixtures';
import { create } from 'zustand';
import {BODHI,nearBodhiAltar} from './bodhiData';
import {bowDuration,type BowSession} from './bowTimeline';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createBufferedStorage } from './saveStorage';
import { surfaceHeight, seatExit, templeOffering, OFFERING_RANGE, OFFERING_DURATION, OFFERING_CAPACITY, dishes, distance, incenseSpot, incenseApproach, INCENSE_CLEARANCE, INCENSE_RANGE, INCENSE_DURATION, INCENSE_BURN_MS, INCENSE_STUB_MS, INCENSE_MAX_STICKS, gardenPlots, nearestSeat, place, places, seats, scriptures, zoneAt, type DishId, type PlaceId, type Vec2, type Vec3 } from './gameData';
import {BELL_DURATION, LANTERN_RISE, LANTERN_LIFETIME, MAX_LANTERNS, WISH_STATION, WISH_APPROACH} from './ritualMotion';
import {serviceTimes} from './mealService';
import {BEAD_STEP_MS} from './beadMotion';
export type Activity='carryWater'|'pray'|'bow'|'sweep'|'meditate'|'feed'|'bell'|'lantern'|'incense'|'beads'|'chant'|'mok'|'candle'|'flower'|'read'|'plant'|'water'|'harvest'|'meal'|'tea'|'walk';
export type Action='drawWater'|'carryWater'|'pourWater'|'plant'|'water'|'harvest'|'feed'|'flower'|'candle'|'incense'|'walk'|'sit'|'eat'|'pray'|'bow'|'sweep'|'meditate'|'beads'|'chant'|'mok'|'read'|'tea';

export type Item='feed'|'lantern'|'incense'|'candle'|'flower'|'seed'|'vegetable';
export type Reflection='teaMoment'|'chantMoment'|'bellMoment'|'lanternMoment';
export type Panel='journey'|'bag'|'map'|'settings'|'help'|'activities'|'donate'|'seats'|'menu'|'library'|'dialogue'|'wish'|'chat'|Reflection|null;
export const activities:{id:Activity;name:string;hint:string;zone?:PlaceId}[]=[
  {id:'pray',name:'Chắp tay',hint:'Một niệm an lành'}, {id:'bow',name:'Lạy Phật',hint:'Lạy ngay tại chỗ đang đứng hoặc ngồi'},
  {id:'meditate',name:'Ngồi thiền',hint:'Chọn bồ đoàn gần nhất'}, {id:'chant',name:'Tụng kinh',hint:'Ngồi trong thiền đường',zone:'hall'},
  {id:'mok',name:'Gõ mõ',hint:'Giữ nhịp chậm rãi',zone:'hall'}, {id:'beads',name:'Tràng hạt',hint:'Lần từng hạt trên tay'},
  {id:'sweep',name:'Quét lá',hint:'Gom lá quanh các gốc cây'}, {id:'carryWater',name:'Gánh nước',hint:'Giếng cạnh vườn · Giao nước sau bếp'}, {id:'incense',name:'Dâng hương',hint:'Một nén tâm hương',zone:'temple'},
  {id:'candle',name:'Dâng đèn',hint:'Một ánh sáng nhỏ',zone:'temple'}, {id:'flower',name:'Dâng hoa',hint:'Đặt hoa lên bàn thờ',zone:'temple'},
  {id:'bell',name:'Thỉnh chuông',hint:'Lắng nghe âm vang',zone:'bell'}, {id:'feed',name:'Cho cá ăn',hint:'Đàn koi bên hồ',zone:'pond'},
  {id:'lantern',name:'Thả hoa đăng',hint:'Gửi một lời nguyện',zone:'lotus'}, {id:'read',name:'Đọc sách',hint:'Tàng kinh các',zone:'library'},
  {id:'meal',name:'Dùng bữa chay',hint:'Bốn món ở Hương Thiền',zone:'dining'}, {id:'tea',name:'Uống trà',hint:'Ngắm núi ở vọng đình',zone:'terrace'},
];
export function localDay(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
export const emptyProgress=():Record<Activity,number>=>Object.fromEntries(['carryWater','pray','bow','sweep','meditate','feed','bell','lantern','incense','beads','chant','mok','candle','flower','read','plant','water','harvest','meal','tea','walk'].map(k=>[k,0])) as Record<Activity,number>;
export const LEAVES_PER_MERIT=10;
export const dailyTasks=[
  {id:'sweep',title:'Sân chùa sạch lá',desc:'Gom 10 lá · +1 công đức tự động',target:LEAVES_PER_MERIT,reward:0},
  {id:'feed',title:'Chăm đàn cá nhỏ',desc:'Cho cá koi ăn 3 lần',target:3,reward:25},
  {id:'meditate',title:'Một phút trở về',desc:'Thiền trên bồ đoàn 60 giây',target:60,reward:40},
  {id:'meal',title:'Ăn trong chánh niệm',desc:'Dùng trọn một bữa chay',target:1,reward:25},
  {id:'harvest',title:'Rau xanh cho bếp',desc:'Thu hoạch 2 luống rau',target:2,reward:35},
  {id:'incense',title:'Một nén tâm hương',desc:'Dâng hương tại một bàn thờ',target:1,reward:15},
] as const;
export const achievements=[
  {id:'explorer',title:'Một vòng an nhiên',desc:'Khám phá đủ 13 khu vực',target:13,reward:100,metric:'visits'},
  {id:'seeker',title:'Tâm như mặt hồ',desc:'Tích lũy 300 giây thiền',target:300,reward:100,metric:'meditate'},
  {id:'diner',title:'Bốn vị thanh đạm',desc:'Thưởng thức cả 4 món chay',target:4,reward:100,metric:'dishes'},
  {id:'gardener',title:'Đôi tay vun trồng',desc:'Thu hoạch 12 luống rau',target:12,reward:80,metric:'harvest'},
  {id:'caretaker',title:'Lá về cội',desc:'Gom 100 chiếc lá',target:100,reward:80,metric:'sweep'},
  {id:'reader',title:'Trang sách mở',desc:'Đọc đủ 4 bài thực tập',target:4,reward:60,metric:'books'},
] as const;
export interface MealOrder {dish:DishId;seatId:string;status:'preparing'|'ready'|'eating'|'finished';readyAt:number;orderedAt?:number;cookedAt?:number;counterReadyAt?:number;kitchenAt?:number;deliveryAt?:number;homeAt?:number;eatUntil?:number}
export interface PlotState {revision?:number;by?:string;plantedAt:number;wateredAt:number|null;harvested:boolean}

export interface Wish {text:string;at:number}
export interface Peer {id:string;name:string;robe:string;gender?:'male'|'female';skin?:string;robeStyle?:'traditional'|'cross';x:number;y:number;z:number;heading:number;action:Action;seat:string|null;bow?:BowSession|null;meal?:MealOrder|null}
export interface ChatMessage {id:string;name:string;text:string;at:number;system?:boolean}
export interface GameState {
  waterQuest:WaterQuest|null;waterJars:WaterJarState[];lastWaterDeliveryAt:number;waterTask:(jar?:number)=>void;cancelWaterTask:()=>void;tickWaterTask:()=>void;
  meditationBow:boolean;bow:BowSession|null;finishBow:()=>void;
  name:string;robe:string;gender:'male'|'female';skin:string;robeStyle:'traditional'|'cross';characterConfigured:boolean;merit:number;peace:number;experience:number;energy:number;day:string;started:boolean;
  progress:Record<Activity,number>;lifetime:Record<Activity,number>;sweepRemainder:number;inventory:Record<Item,number>;claimed:string[];badges:string[];
  beadStepAt:number;advanceBead:()=>void;
  visited:PlaceId[];readBooks:string[];tasted:DishId[];gardenPending:string|null;plots:Record<string,PlotState>;wishes:Wish[];
  lastFishFedAt:number;fishFeedAt:number;fishFeeds:{at:number;x:number;z:number}[];offeringSlots:Record<string,string>;offeringFocus:string|null;offerings:{flower:number[];candle:number[]};burningIncense:number[];action:Action;panel:Panel;night:boolean;sound:boolean;chantMusic:boolean;quality:'high'|'low';camera:'follow'|'overview';cameraYaw:number;cameraReset:number;

  position:Vec2;height:number;heading:number;destination:Vec2|null;seated:string|null;pendingSeat:string|null;pendingAction:Action;
  teleport:{position:Vec3;heading:number;at:number}|null;event:{type:Activity;at:number;x:number;z:number;target?:string}|null;toast:{text:string;id:number}|null;
  meal:MealOrder|null;npc:string|null;scripture:string;sessionSeconds:number;meditationSeconds:number;bodhiIncense:number;
  pendingActivity:Activity|null;ceremony:{type:'bell'|'lantern';at:number;text?:string}|null;flights:Wish[];reflectionWish:string;
  connection:'connecting'|'online'|'offline';room:string;peers:Peer[];messages:ChatMessage[];chatUnread:number;playerId:string;
  set:(v:Partial<GameState>)=>void;notify:(text:string)=>void;record:(activity:Activity,amount?:number)=>void;checkDay:()=>void;
  go:(id:PlaceId)=>void;sit:(id?:string,action?:Action)=>void;stand:()=>void;perform:(activity:Activity,stationId?:string)=>void;
  orderMeal:(id:DishId)=>void;eat:()=>void;tick:()=>void;garden:(id:string)=>void;buy:(item:Item)=>void;claim:(id:string)=>void;claimBadge:(id:string)=>void;
  read:(id:string)=>void;releaseWish:(text:string)=>void;arriveSeat:(id:string)=>void;closePanel:()=>void;
}
export const MEDITATION_GOAL_SECONDS = 60;
const timed:Action[]=['meditate','beads','chant','mok','pray'];
export function achievementValue(s:Pick<GameState,'visited'|'tasted'|'readBooks'|'lifetime'>,metric:string){return metric==='visits'?s.visited.length:metric==='dishes'?s.tasted.length:metric==='books'?s.readBooks.length:s.lifetime[metric as Activity]||0;}
export const floorAt=surfaceHeight;
export const useGame=create<GameState>()(persist((set,get)=>({
  waterQuest:null,waterJars:emptyWaterJars(),lastWaterDeliveryAt:0,...createWaterQuestActions(set,get),
  name:'An Nhiên',robe:'#9b704a',gender:'male',skin:'#c99c79',robeStyle:'traditional',characterConfigured:false,merit:0,peace:0,experience:0,energy:80,day:localDay(),started:false,
  progress:emptyProgress(),lifetime:emptyProgress(),sweepRemainder:0,inventory:{feed:20,lantern:5,incense:10,candle:8,flower:8,seed:12,vegetable:0},claimed:[],badges:[],visited:[],readBooks:[],tasted:[],gardenPending:null,plots:{},wishes:[],
  lastFishFedAt:0,fishFeedAt:0,fishFeeds:[],offeringSlots:{},offeringFocus:null,offerings:{flower:[],candle:[]},burningIncense:[],action:'walk',panel:null,night:false,sound:false,chantMusic:true,quality:typeof window!=='undefined'&&window.matchMedia?.('(pointer: coarse)').matches?'low':'high',camera:'follow',cameraYaw:0,cameraReset:0,

  position:[0,22],height:.06,heading:Math.PI,destination:null,seated:null,pendingSeat:null,pendingAction:'sit',teleport:null,event:null,toast:null,meal:null,npc:null,scripture:'breath',sessionSeconds:0,meditationSeconds:0,meditationBow:false,bodhiIncense:0,bow:null,
  pendingActivity:null,ceremony:null,flights:[],reflectionWish:'',
  connection:'connecting',room:'an-nhien',peers:[],messages:[],chatUnread:0,playerId:'',
  set,notify:text=>set({toast:{text,id:Date.now()}}),
  beadStepAt:0,
  advanceBead:()=>{
    const state=get(),now=Date.now();
    if(state.action!=='beads'||state.panel||now-state.beadStepAt<BEAD_STEP_MS)return;
    state.record('beads');
    set({beadStepAt:now});
  },
  closePanel:()=>{const s=get();set({panel:null});if(s.action==='tea'||s.action==='chant')set({action:s.seated?'sit':'walk'});},
  checkDay:()=>{if(get().day!==localDay())set({day:localDay(),progress:emptyProgress(),claimed:[]});},
  record:(activity,amount=1)=>{
    get().checkDay();
    set(s=>{
      const leaves=s.sweepRemainder+amount;
      const reward=activity==='sweep'?Math.floor(leaves/LEAVES_PER_MERIT)
        :['meditate','chant','walk','pray','beads','mok'].includes(activity)?0
        :amount*(activity==='carryWater'?WATER_TASK.reward:2);
      return {
        ...(activity==='meditate'&&s.action==='meditate'&&s.seated ? {meditationSeconds:Math.min(MEDITATION_GOAL_SECONDS,s.meditationSeconds+amount),...(s.meditationSeconds+amount>=MEDITATION_GOAL_SECONDS?{action:'bow' as Action,bow:{at:Date.now(),mode:'cushion' as const},meditationBow:true}:{})} : {}),
        progress:{...s.progress,[activity]:(s.progress[activity]||0)+amount},
        lifetime:{...s.lifetime,[activity]:(s.lifetime[activity]||0)+amount},
        ...(activity==='sweep'?{sweepRemainder:leaves%LEAVES_PER_MERIT}:{}),
        experience:s.experience+amount,
        merit:s.merit+reward,
        peace:Math.min(100,s.peace+amount*(activity==='walk'?.025:timed.includes(activity as Action)?.15:1)),
      };
    });
  },
  go:id=>{get().stand();const p=place(id);set({destination:[p.x,p.z],pendingSeat:null,action:get().waterQuest?'carryWater':'walk',panel:null});get().notify(`Đang đi đến ${p.name.toLowerCase()}${get().waterQuest?' · Đang gánh nước':' · Giữ Shift để bước nhanh'}`);},
  stand:()=>{const s=get();if(s.seated){const seat=seats.find(c=>c.id===s.seated);if(seat){const [x,z]=seatExit(seat);set({teleport:{position:[x,floorAt(x,z)+.08,z],heading:seat.rotation,at:Date.now()}});}}const water=s.waterQuest,resume=water?.phase==='carrying'||water?.phase==='pouring';set({waterQuest:water?.phase==='drawing'?null:water?.phase==='pouring'?{...water,phase:'carrying',phaseAt:Date.now(),jar:null}:water,seated:null,pendingSeat:null,pendingActivity:null,action:resume?'carryWater':'walk',destination:null,bow:null});if(s.meal?.status==='eating')set({meal:{...s.meal,status:'ready',eatUntil:undefined}});},
  finishBow:()=>{const s=get();if(s.action==='bow'&&s.bow&&Date.now()-s.bow.at>=bowDuration(s.bow.mode)*1000)set({action:s.seated?(s.meditationBow?'meditate':'sit'):'walk',bow:null,...(s.meditationBow?{meditationBow:false,meditationSeconds:0}:{})});},
  sit:(id,action='sit')=>{const s=get();if(s.waterQuest){s.notify('Bạn đang gánh nước. Giao nước hoặc đặt gánh xuống trước khi ngồi nhé.');return;}if(s.seated&&!id){if(action==='sit'){s.stand();return;}set({action,bow:null});return;}const seat=id?seats.find(c=>c.id===id):nearestSeat(s.position,action==='meditate'||action==='chant'||action==='mok'?['cushion']:['cushion','bench','tea']);if(!seat)return;
    if(s.peers.some(p=>p.seat===seat.id)){s.notify('Chỗ này đang có người ngồi. Bạn chọn chỗ bên cạnh nhé.');return;}
    if(s.seated===seat.id){set({action,bow:null});return;}s.stand();set({pendingSeat:seat.id,pendingAction:seat.kind==='reading'?'read':action,destination:[seat.position[0],seat.position[2]],panel:null});s.notify(`Đến ${seat.label.toLowerCase()} · Nhấn E để đứng dậy`);
  },
  arriveSeat:id=>{const s=get();if(s.waterQuest)return;const seat=seats.find(c=>c.id===id);if(!seat)return;if(s.peers.some(p=>p.seat===id)){set({pendingSeat:null,pendingActivity:null,destination:null});s.notify('Chỗ này đang có người ngồi.');return;}
    const activity=s.pendingActivity;set({seated:id,pendingSeat:null,pendingActivity:null,destination:null,action:s.pendingAction,position:[seat.position[0],seat.position[2]],height:seat.position[1],heading:seat.rotation,panel:seat.kind==='dining'&&(!s.meal||s.meal.status==='finished')?'menu':seat.kind==='reading'?'library':null});
    if(activity==='tea'||activity==='chant')get().perform(activity);
  },
  perform:(activity,stationId)=>{const s=get();if(activity==='carryWater'){s.waterTask();return;}if(s.waterQuest){s.notify('Giao nước vào lu hoặc đặt gánh xuống trước khi thực tập nhé.');return;}if(activity==='bow'&&s.action==='bow'&&s.bow&&Date.now()-s.bow.at<bowDuration(s.bow.mode)*1000)return;if(['incense','flower','candle'].includes(s.action)||offeringPending())return;
    if(activity==='feed'){const station=nearestFeedStation(s.position);
      if(distance(s.position,station.spot)>1.8){s.stand();set({destination:station.spot,panel:null});s.notify('Đến gần mép hồ rồi bấm Cho cá ăn nhé.');return;}
      if(Date.now()-s.lastFishFedAt<3000){s.notify('Đợi cá ăn một chút rồi cho thêm nhé.');return;}
      if(s.inventory.feed<1){set({panel:'bag'});s.notify('Thức ăn đã hết. Mở túi vải để đổi thêm.');return;}
      if(s.connection==='connecting'){s.notify('Đang kết nối phòng, bạn đợi một chút nhé.');return;}
      if(s.connection==='online'){void completeSharedOffering('feed',station.id);return;}
      set({lastFishFedAt:Date.now(),fishFeedAt:Date.now(),fishFeeds:[...s.fishFeeds.filter(f=>Date.now()-f.at<12000),{at:Date.now(),x:station.target[0],z:station.target[1]}].slice(-12),action:'feed',event:{type:'feed',at:Date.now(),x:station.target[0],z:station.target[1]},inventory:{...s.inventory,feed:s.inventory.feed-1}});s.record('feed');s.notify('Đàn koi đang bơi đến ăn. +2 công đức');return;
    }
    if(activity==='flower'||activity==='candle'){
if(stationId?.startsWith('flower-front-')){s.notify('Bình này chỉ để trang trí. Mời bạn chọn bình bên trong bàn thờ.');return;}
      const config=stationId?offeringStation(activity,stationId):nearestOfferingStation(activity,s.position,s.offeringFocus);set({offeringFocus:config.id});if(distance(s.position,config.spot)>OFFERING_RANGE){s.stand();set({destination:config.approach,panel:null});s.notify('Đến bàn '+(activity==='flower'?'dâng hoa trên bàn thờ':'dâng đèn trên bàn thờ')+' rồi bấm lại để thực hiện.');return;}
      if(s.inventory[activity]<1){set({panel:'bag'});s.notify('Vật phẩm đã hết. Mở túi vải để đổi thêm.');return;}
      if(offeringCount(s.offerings[activity],s.offeringSlots,config,Date.now(),templeOffering[activity].lifetime)>=OFFERING_CAPACITY){s.notify('Bàn đã đủ lễ vật. Mời bạn đợi một chút rồi quay lại.');return;}
      s.stand();set({action:activity,panel:null,event:{type:activity,at:Date.now(),x:s.position[0],z:s.position[1],target:config.id}});s.notify(activity==='flower'?'Đang thành tâm dâng hoa…':'Đang châm đèn sen…');return;
    }
    if(activity==='incense'&&(stationId===QUAN_AM.incenseId||nearQuanAm(s.position))){if(!nearQuanAm(s.position)){s.stand();set({destination:[...QUAN_AM.approach],panel:null});s.notify('Đến trước bàn hương Quan Âm rồi nhấn E để dâng hương.');return;}if(s.inventory.incense<1){set({panel:'bag'});s.notify('Bạn đã hết hương. Mở túi vải để đổi thêm nhé.');return;}s.stand();set({action:'incense',destination:null,pendingSeat:null,panel:null,event:{type:'incense',at:Date.now(),x:s.position[0],z:s.position[1],target:QUAN_AM.incenseId}});s.notify('Thành tâm dâng hương trước Quán Thế Âm Bồ Tát…');return;}
    if(activity==='incense'&&nearBodhiAltar(s.position)){if(s.event&&Date.now()-s.event.at<900)return;if(s.inventory.incense<1){set({panel:'bag'});return;}set({inventory:{...s.inventory,incense:s.inventory.incense-1},bodhiIncense:s.bodhiIncense+1,event:{type:'incense',at:Date.now(),x:BODHI.x,z:BODHI.altarZ}});s.record('incense');return;}
    if(activity==='incense'){
      if(distance(s.position,incenseSpot)>INCENSE_RANGE||distance(s.position,incenseSpot)<INCENSE_CLEARANCE){s.stand();set({destination:incenseApproach,panel:null});s.notify('Đến trước lư hương, rồi nhấn E để dâng hương.');return;}
      if(s.inventory.incense<1){set({panel:'bag'});s.notify('Bạn đã hết hương. Mở túi vải để đổi thêm.');return;}
      s.stand();set({action:'incense',destination:null,pendingSeat:null,panel:null,event:{type:'incense',at:Date.now(),x:s.position[0],z:s.position[1]}});s.notify('Thành tâm dâng một nén hương…');return;
    }
if(activity==='pray'||activity==='beads'){set({action:s.action===activity?(s.seated?'sit':'walk'):activity,destination:null,pendingSeat:null,pendingActivity:null,bow:null});return;}if((activity==='bell'||activity==='lantern')&&s.ceremony){s.notify('Mời bạn lắng lại cùng khoảnh khắc đang diễn ra.');return;}if(s.event&&Date.now()-s.event.at<900&&!['tea','read','chant','meditate','mok','meal'].includes(activity))return;
    if(activity==='meditate'||activity==='chant'||activity==='mok'){
      if(activity==='chant'&&s.seated&&seats.find(c=>c.id===s.seated)?.zone==='hall'){set({action:'chant',panel:'chantMoment',destination:null});return;}
      if(s.action===activity){s.stand();return;}const target=activity==='chant'||activity==='mok'?seats.find(c=>c.zone==='hall'&&!s.peers.some(p=>p.seat===c.id)):seats.filter(c=>c.kind==='cushion'&&!s.peers.some(p=>p.seat===c.id)).sort((a,b)=>distance(s.position,[a.position[0],a.position[2]])-distance(s.position,[b.position[0],b.position[2]]))[0];
      if(!target){s.notify('Các chỗ đang có người ngồi. Mời bạn chọn chỗ khác.');return;}s.sit(target.id,activity==='chant'?'sit':activity);if(activity==='chant')set({pendingActivity:'chant'});return;}
    if(activity==='meal'){if(s.seated&&seats.find(c=>c.id===s.seated)?.kind==='dining'){set({panel:'menu'});}else{const seat=seats.filter(c=>c.kind==='dining'&&!s.peers.some(p=>p.seat===c.id)).sort((a,b)=>distance(s.position,[a.position[0],a.position[2]])-distance(s.position,[b.position[0],b.position[2]]))[0];if(!seat){s.notify('Nhà ăn đang đầy. Mời bạn chọn chỗ sau nhé.');return;}s.sit(seat.id,'sit');s.notify('Mời bạn chọn bồ đoàn tại bàn ăn rồi mở thực đơn.');}return;}
    if(activity==='tea'){if(!s.seated||seats.find(c=>c.id===s.seated)?.kind!=='tea'){const seat=seats.filter(c=>c.kind==='tea'&&!s.peers.some(p=>p.seat===c.id)).sort((a,b)=>distance(s.position,[a.position[0],a.position[2]])-distance(s.position,[b.position[0],b.position[2]]))[0];if(!seat){s.notify('Bàn trà đang đầy. Mời bạn quay lại sau.');return;}s.sit(seat.id);set({pendingActivity:'tea'});return;}if(s.action!=='tea'){s.record('tea');set({energy:Math.min(100,s.energy+10),event:{type:activity,at:Date.now(),x:s.position[0],z:s.position[1]}});}set({action:'tea',panel:'teaMoment'});return;}
    if(activity==='read'){if(seats.find(c=>c.id===s.seated)?.kind==='reading'){set({action:'read',panel:'library'});return;}const seat=seats.filter(c=>c.kind==='reading'&&!s.peers.some(p=>p.seat===c.id)).sort((a,b)=>distance(s.position,[a.position[0],a.position[2]])-distance(s.position,[b.position[0],b.position[2]]))[0];if(seat)s.sit(seat.id,'read');else s.notify('Bàn đọc đang đầy. Mời bạn chọn chỗ sau nhé.');return;}
    if(activity==='bell'&&s.ceremony?.type==='bell')return;
    const atBodhi=false;const zone=activities.find(a=>a.id===activity)?.zone;
    const anchor:Vec2=activity==='lantern'?WISH_STATION:zone?[place(zone).x,place(zone).z]:s.position;
    if(zone&&distance(s.position,anchor)>(activity==='bell'?6:activity==='lantern'?4:9)){s.stand();set({destination:activity==='lantern'?WISH_APPROACH:anchor,pendingActivity:activity==='lantern'||activity==='bell'?activity:null});s.notify(`Đang đến ${place(zone).name.toLowerCase()}.`);return;}

    if(activity==='lantern'){set({panel:'wish'});return;}
    const consumable=(['feed','incense','candle','flower'] as string[]).includes(activity)?activity as Item:null;
    if(consumable){if(s.inventory[consumable]<=0){set({panel:'bag'});s.notify('Vật phẩm đã hết. Ghé túi vải để đổi thêm.');return;}set({inventory:{...s.inventory,[consumable]:s.inventory[consumable]-1}});}
    if(activity==='sweep'){s.stand();set({action:s.action==='sweep'?'walk':'sweep'});}else if(['pray','beads'].includes(activity))set({action:s.action===activity?'sit' as Action:activity as Action});else if(activity==='bow'){const cushion=!!s.seated&&seats.find(c=>c.id===s.seated)?.kind==='cushion';if(!cushion)s.stand();set({action:'bow',bow:{at:Date.now(),mode:cushion?'cushion':'standing'},destination:null,pendingSeat:null,pendingActivity:null});}
    set({event:{type:activity,at:Date.now(),x:atBodhi?BODHI.x:s.position[0],z:atBodhi?BODHI.altarZ:s.position[1]},...(atBodhi?{bodhiIncense:s.bodhiIncense+1}:{})});
    if(activity==='bell')set({ceremony:{type:'bell',at:Date.now()}});
    if(!['sweep','pray','beads'].includes(activity))s.record(activity);
    s.notify(activity==='sweep'?'Đi gần lá rụng để gom lá. Lá được tạo thêm theo thời gian.':activity==='bell'?'Nghe một tiếng chuông, trở về khoảnh khắc này.':activity==='bow'?'Một lạy thành tâm.':'Thả lỏng vai, chậm lại cùng hơi thở.');
  },
  orderMeal:id=>{const s=get();const seat=seats.find(c=>c.id===s.seated);if(!seat||seat.kind!=='dining'){s.notify('Bạn cần ngồi vào bồ đoàn tại bàn ăn để gọi món.');return;}if(s.meal&&s.meal.status!=='finished'){s.notify('Bạn đang có một phần ăn. Dùng xong rồi gọi món tiếp nhé.');return;}if(s.meal?.homeAt&&Date.now()<s.meal.homeAt){s.notify('Cô Tâm đang trở về quầy, mời bạn đợi một chút nhé.');return;}if(!dishes.some(d=>d.id===id))return;set({meal:{dish:id,seatId:seat.id,status:'preparing',...serviceTimes(seat.id,Date.now())},panel:null,action:'sit'});s.notify(`Bếp đang chuẩn bị ${dishes.find(d=>d.id===id)!.name.toLowerCase()}. Món sẽ tới bàn trong giây lát.`);},
  eat:()=>{const s=get();if(!s.meal||s.meal.status!=='ready')return;if(s.seated!==s.meal.seatId){s.sit(s.meal.seatId);return;}set({meal:{...s.meal,status:'eating',eatUntil:Date.now()+9000},action:'eat'});s.notify('Ăn chậm, trân trọng từng hương vị.');},
  tick:()=>{const s=get();s.checkDay();s.tickWaterTask();if(!s.gardenPending&&['feed','plant','water','harvest'].includes(s.action)&&s.event&&Date.now()-s.event.at>(s.action==='feed'?1400:2200))set({action:'walk'});
    const fresh={flower:s.offerings.flower.filter(at=>Date.now()-at<templeOffering.flower.lifetime),candle:s.offerings.candle.filter(at=>Date.now()-at<templeOffering.candle.lifetime)};
    if(fresh.flower.length!==s.offerings.flower.length||fresh.candle.length!==s.offerings.candle.length)set({offerings:fresh});
    if((s.action==='flower'||s.action==='candle')&&s.event?.type===s.action&&Date.now()-s.event.at>=OFFERING_DURATION){const kind=s.action;
      const station=offeringStation(kind,s.event.target),completedAt=Math.max(Date.now(),...[...fresh.flower,...fresh.candle].map(t=>t+1));if(distance(s.position,station.spot)<=OFFERING_RANGE&&s.inventory[kind]>0&&offeringCount(fresh[kind],s.offeringSlots,station,Date.now(),templeOffering[kind].lifetime)<OFFERING_CAPACITY){if(s.connection==='online'){set({action:'walk'});void completeSharedOffering(kind,station.id);return;}set({action:'walk',inventory:{...s.inventory,[kind]:s.inventory[kind]-1},offeringSlots:{...s.offeringSlots,[completedAt]:station.id},offerings:{...fresh,[kind]:[...fresh[kind],completedAt]}});s.record(kind);s.notify(kind==='flower'?'Hoa đã được đặt lên bàn. +2 công đức':'Đèn sen đã được thắp. +2 công đức');}else set({action:'walk'});
    }

    const liveTimes=new Set([...get().offerings.flower,...get().offerings.candle,...get().burningIncense].map(String));if(Object.keys(s.offeringSlots).some(t=>!liveTimes.has(t)))set({offeringSlots:Object.fromEntries(Object.entries(get().offeringSlots).filter(([t])=>liveTimes.has(t))) });
    const burning=s.burningIncense.filter(at=>Date.now()-at<INCENSE_BURN_MS+INCENSE_STUB_MS).slice(-INCENSE_MAX_STICKS);if(burning.length!==s.burningIncense.length)set({burningIncense:burning});
    if(s.action==='incense'&&s.event?.type==='incense'&&Date.now()-s.event.at>=INCENSE_DURATION){
      const shrine=s.event.target===QUAN_AM.incenseId,near=shrine?nearQuanAm(s.position):distance(s.position,incenseSpot)<=INCENSE_RANGE;
      if(near&&s.inventory.incense>0){if(s.connection==='online'){set({action:'walk'});void completeSharedOffering('incense',shrine?QUAN_AM.incenseId:undefined);return;}const at=Math.max(Date.now(),...burning.map(t=>t+1));set({inventory:{...s.inventory,incense:s.inventory.incense-1},burningIncense:[...burning,at].slice(-INCENSE_MAX_STICKS),offeringSlots:{...get().offeringSlots,...(shrine?{[at]:QUAN_AM.incenseId}:{})},action:'walk'});s.record('incense');s.notify(shrine?'Đã dâng hương trước Quan Âm. +2 công đức':'Đã dâng một nén hương. +2 công đức');}else set({action:'walk'});
    }
const zone=zoneAt(s.position);if(!s.visited.includes(zone.id)&&distance(s.position,[zone.x,zone.z])<12)set({visited:[...s.visited,zone.id]});set({sessionSeconds:s.sessionSeconds+1});
if(s.flights.some(f=>Date.now()-f.at>=LANTERN_LIFETIME))set({flights:s.flights.filter(f=>Date.now()-f.at<LANTERN_LIFETIME)});
    if(!s.panel&&s.ceremony&&Date.now()-s.ceremony.at>=(s.ceremony.type==='bell'?BELL_DURATION:LANTERN_RISE)){set({panel:s.ceremony.type==='bell'?'bellMoment':'lanternMoment',reflectionWish:s.ceremony.text||'',ceremony:null});}

    if(s.meal?.status==='preparing'&&Date.now()>=s.meal.readyAt){set({meal:{...s.meal,status:'ready'}});s.notify('Bữa chay đã được đặt lên bàn. Chúc bạn ăn ngon miệng!');}
    if(s.meal?.status==='eating'&&s.action==='eat'&&s.seated===s.meal.seatId&&Date.now()>=(s.meal.eatUntil||Infinity)){const dish=dishes.find(d=>d.id===s.meal!.dish)!;s.record('meal');set({meal:{...s.meal,status:'finished'},action:'sit',energy:Math.min(100,s.energy+dish.energy),tasted:s.tasted.includes(dish.id)?s.tasted:[...s.tasted,dish.id]});s.notify(`Bữa ${dish.name.toLowerCase()} đã hoàn thành. +${dish.energy} năng lượng · +2 công đức`);}
  },
  garden:id=>{const s=get();if(s.waterQuest){s.notify('Giao nước cho bếp trước khi chăm vườn nhé.');return;}if(gardenBusy)return;const plot=gardenPlots.find(p=>p.id===id);if(!plot)return;if(distance(s.position,[plot.x,plot.z])>3){s.stand();set({destination:[plot.x,plot.z+1]});s.notify('Đến gần luống rau rồi bấm lại để chăm cây.');return;}const p=s.plots[id];if(s.connection==='connecting'){s.notify('Đang kết nối vườn chung, bạn đợi một chút nhé.');return;}
    if(s.connection==='online'){
      const action:GardenAction|null=!p||p.harvested?'plant':p.wateredAt===null?'water':Date.now()-p.wateredAt>=60000?'harvest':null;
      if(!action){s.notify('Cây đang lớn. Còn '+Math.ceil((60000-Date.now()+p.wateredAt!)/1000)+' giây nữa.');return;}
      if(action==='plant'&&s.inventory.seed<1){set({panel:'bag'});s.notify('Bạn đã hết hạt giống.');return;}
      void completeGarden(id,action,p?.revision??0);return;
    }if(!p||p.harvested){if(s.inventory.seed<1){set({panel:'bag'});s.notify('Bạn đã hết hạt giống.');return;}set({plots:{...s.plots,[id]:{plantedAt:Date.now(),wateredAt:null,harvested:false}},inventory:{...s.inventory,seed:s.inventory.seed-1}});s.record('plant');s.notify('Hạt giống đã được gieo. Bấm vào luống lần nữa để tưới.');}else if(!p.wateredAt){set({plots:{...s.plots,[id]:{...p,wateredAt:Date.now()}}});s.record('water');s.notify('Đã tưới nước. Cây sẽ sẵn sàng thu hoạch sau 60 giây.');}else if(Date.now()-p.wateredAt>=60000){set({plots:{...s.plots,[id]:{...p,harvested:true}},inventory:{...s.inventory,vegetable:s.inventory.vegetable+3}});s.record('harvest');s.notify('Thu hoạch được 3 bó rau. +2 công đức');}else s.notify(`Cây đang lớn. Còn ${Math.ceil((60000-Date.now()+p.wateredAt)/1000)} giây nữa.`);},
  buy:item=>{const s=get();if(item==='vegetable')return;const cost=item==='lantern'?12:6,qty=item==='feed'?10:item==='seed'?8:5;if(s.merit<cost){s.notify(`Cần ${cost} công đức để đổi thêm.`);return;}set({merit:s.merit-cost,inventory:{...s.inventory,[item]:s.inventory[item]+qty}});s.notify(`Đã thêm ${qty} vật phẩm vào túi.`);},
  claim:id=>{get().checkDay();const s=get(),t=dailyTasks.find(t=>t.id===id);if(!t?.reward||s.claimed.includes(id)||s.progress[t.id]<t.target)return;set({claimed:[...s.claimed,id],merit:s.merit+t.reward});s.notify(`Nhận ${t.reward} công đức từ việc lành hôm nay.`);},
  claimBadge:id=>{const s=get(),a=achievements.find(a=>a.id===id);if(!a||s.badges.includes(id)||achievementValue(s,a.metric)<a.target)return;set({badges:[...s.badges,id],merit:s.merit+a.reward});s.notify(`Dấu mốc mới: ${a.title}. +${a.reward} công đức`);},
  read:id=>{if(!scriptures.some(b=>b.id===id))return;const s=get();set({scripture:id});if(!s.readBooks.includes(id)){set({readBooks:[...s.readBooks,id]});s.record('read');}},
  releaseWish:text=>{const s=get();if(s.ceremony)return;if(distance(s.position,WISH_STATION)>4){s.notify('Mời bạn đến đài hoa đăng bên hồ để gửi lời nguyện.');return;}if(s.inventory.lantern<1){set({panel:'bag'});s.notify('Bạn đã hết hoa đăng.');return;}const clean=text.trim().slice(0,160)||'Cầu mong mọi người đều được bình an.',at=Math.max(Date.now(),(s.wishes[0]?.at||0)+1),wish={text:clean,at};set({inventory:{...s.inventory,lantern:s.inventory.lantern-1},wishes:[wish,...s.wishes].slice(0,30),flights:[wish,...s.flights].slice(0,MAX_LANTERNS),ceremony:{type:'lantern',at,text:clean},event:{type:'lantern',at,x:28,z:35.5},panel:null,destination:null,pendingActivity:null});s.record('lantern');s.notify('Hoa đăng đang nâng lời nguyện của bạn lên từ hồ sen…');},
}),{name:'sen-an-nhien-v1',storage:createJSONStorage(()=>createBufferedStorage(()=>window.localStorage)),version:3,migrate:(stored:any)=>({...stored,inventory:{feed:20,lantern:5,incense:10,candle:8,flower:8,seed:12,vegetable:0,...stored.inventory},progress:{...emptyProgress(),...stored.progress},lifetime:{...emptyProgress(),...stored.progress,...stored.lifetime}}),
  partialize:s=>({waterJars:s.waterJars,lastWaterDeliveryAt:s.lastWaterDeliveryAt,offeringSlots:s.offeringSlots,bodhiIncense:s.bodhiIncense,offerings:s.offerings,burningIncense:s.burningIncense,name:s.name,robe:s.robe,gender:s.gender,skin:s.skin,robeStyle:s.robeStyle,characterConfigured:s.characterConfigured,merit:s.merit,peace:s.peace,experience:s.experience,energy:s.energy,day:s.day,started:s.started,progress:s.progress,lifetime:s.lifetime,sweepRemainder:s.sweepRemainder,inventory:s.inventory,claimed:s.claimed,badges:s.badges,visited:s.visited,readBooks:s.readBooks,tasted:s.tasted,plots:s.plots,wishes:s.wishes,night:s.night,sound:s.sound,chantMusic:s.chantMusic,quality:s.quality,camera:s.camera}),

}));

useGame.subscribe((current, previous) => {
  if ((current.meditationSeconds || current.meditationBow) && ((!current.seated || current.seated !== previous.seated) || (current.action !== 'meditate' && !(current.action === 'bow' && current.meditationBow)))) {
    useGame.setState({meditationSeconds:0,meditationBow:false});
  }
});

export function visitDonationChest(){const s=useGame.getState();s.stand();if(!nearDonationChest(s.position)){s.set({destination:[donationChest.spot[0],donationChest.spot[1]+1.3],panel:null});s.notify('Đến gần hòm công đức để mở bảng ủng hộ.');return;}s.set({panel:'donate'})}

async function completeSharedOffering(kind:SharedOfferingKind,station?:string){
 const room=useGame.getState().room;if(kind==='feed'){const s=useGame.getState();s.stand();s.set({action:'feed',event:{type:'feed',at:Date.now(),x:s.position[0],z:s.position[1]}});}
 try{await submitOffering({kind,station,operation:crypto.randomUUID()});const s=useGame.getState();s.set({...(kind==='feed'?{lastFishFedAt:Date.now()}:{}),inventory:{...s.inventory,[kind]:Math.max(0,s.inventory[kind]-1)}});s.record(kind);if(s.room===room)s.notify(kind==='feed'?'Đàn koi đang bơi đến ăn. Mọi người trong phòng đều nhìn thấy.':'Đã dâng lễ vật. Mọi người trong phòng đều nhìn thấy. +2 công đức');}
 catch{useGame.getState().notify('Chưa gửi được lễ vật. Vật phẩm vẫn còn trong túi, bạn thử lại nhé.');}
}

let gardenBusy=false;
async function completeGarden(plot:string,action:GardenAction,revision:number){
 gardenBusy=true;const before=useGame.getState(),bed=gardenPlots.find(p=>p.id===plot)!;before.stand();useGame.setState({gardenPending:plot,action,event:{type:action,at:Date.now(),x:bed.x,z:bed.z}});
 const room=before.room,startedAt=useGame.getState().event!.at;
 try{await new Promise(resolve=>setTimeout(resolve,2000));const current=useGame.getState();if(current.room!==room||current.action!==action||current.event?.at!==startedAt||current.connection!=='online'||distance(current.position,[bed.x,bed.z])>3)throw new Error('Đã dừng chăm cây. Vật phẩm vẫn còn trong túi.');await submitGarden({plot,action,revision,operation:crypto.randomUUID()});const s=useGame.getState();s.set({inventory:{...s.inventory,...(action==='plant'?{seed:Math.max(0,s.inventory.seed-1)}:action==='harvest'?{vegetable:s.inventory.vegetable+3}:{})}});s.record(action);s.notify(action==='plant'?'Đã gieo hạt. Mời bạn tưới nước cho cây.':action==='water'?'Đã tưới nước. Cây sẽ lớn sau 60 giây.':'Đã thu hoạch 3 bó rau. +2 công đức');}
 catch(error){useGame.getState().notify(error instanceof Error?error.message:'Chưa chăm được cây, bạn thử lại nhé.');}
 finally{gardenBusy=false;const current=useGame.getState();useGame.setState({gardenPending:null,...(current.event?.at===startedAt&&current.action===action?{action:'walk' as Action}:{})})}
}
