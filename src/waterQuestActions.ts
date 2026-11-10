import {submitWorld} from './worldTransport';
import {sharedActivityBlocked} from './sharedActivity';
import {createClientId} from './clientIds';
import type {GameState} from './gameStore';
import {WATER_TASK,WATER_WELL,WATER_JARS,jarUnits,nearWaterWell,nearWaterJar,nearestWaterJar} from './waterTaskData';
export function createWaterQuestActions(set:(patch:Partial<GameState>)=>void,get:()=>GameState){let deliveryPending=false;return {
  cancelWaterTask:()=>{const s=get();if(!s.waterQuest)return;set({waterQuest:null,action:'walk',destination:null,pendingActivity:null});s.notify('Đã đặt gánh xuống. Khi muốn tiếp tục, ghé giếng nhận nước nhé.');},
  waterTask:(jarId?:number)=>{const s=get(),now=Date.now(),quest=s.waterQuest;
    if(sharedActivityBlocked(s))return;
    if(s.gardenPending||['incense','flower','candle'].includes(s.action)){s.notify('Hoàn tất công việc đang làm trước khi gánh nước nhé.');return;}
    if(!quest){
      if(jarId!==undefined){s.notify('Ghé giếng nhận một gánh nước trước nhé.');return;}
      if(!nearestWaterJar(s.position,s.waterJars,now,true)){s.notify('Bốn lu đang đầy. Bếp sẽ dùng dần, mời bạn quay lại sau nhé.');return;}
      if(!nearWaterWell(s.position)){s.stand();set({destination:[...WATER_WELL.approach],pendingActivity:'carryWater',panel:null});s.notify('Đang đến giếng cạnh vườn rau để nhận nước.');return;}
      s.stand();set({waterQuest:{phase:'drawing',startedAt:now,phaseAt:now,room:s.room,jar:null},action:'drawWater',panel:null,destination:null,pendingSeat:null,pendingActivity:null,bow:null});s.notify('Đang kéo gàu lên, chuẩn bị đôi thùng nước…');return;
    }
    if(quest.room!==s.room){get().cancelWaterTask();return;}
    if(quest.phase!=='carrying')return;
    if(jarId!==undefined&&(!Number.isInteger(jarId)||!WATER_JARS[jarId]))return;
    const target=jarId!==undefined?WATER_JARS[jarId]:quest.jar!==null&&jarUnits(s.waterJars[quest.jar],now)<WATER_TASK.jarCapacity?WATER_JARS[quest.jar]:nearestWaterJar(s.position,s.waterJars,now,true);
    if(!target){s.notify('Các lu đang đầy. Bạn có thể đặt gánh xuống hoặc chờ bếp dùng bớt nước.');return;}
    if(jarUnits(s.waterJars[target.id],now)>=WATER_TASK.jarCapacity){s.notify('Lu này đã đầy. Mời bạn chọn lu bên cạnh.');return;}
    if(!nearWaterJar(s.position,target.id)){set({waterQuest:{...quest,jar:target.id},action:'carryWater',destination:[...target.approach],pendingActivity:'carryWater',panel:null});s.notify(`Mang nước tới lu ${target.id+1} sau nhà ăn. +${WATER_TASK.reward} công đức khi giao xong.`);return;}
    set({waterQuest:{...quest,phase:'pouring',phaseAt:now,jar:target.id},action:'pourWater',destination:null,pendingActivity:null,panel:null});s.notify(`Đang rót nước vào lu ${target.id+1}…`);
  },
  tickWaterTask:()=>{const s=get(),q=s.waterQuest;if(!q)return;const now=Date.now();
    if(q.room!==s.room){get().cancelWaterTask();return;}
    if(q.phase==='drawing'){
      if(s.action!=='drawWater'||!nearWaterWell(s.position)){set({waterQuest:null,action:'walk',pendingActivity:null});s.notify('Đã dừng lấy nước. Ghé giếng để bắt đầu lại nhé.');return;}
      if(now-q.phaseAt>=WATER_TASK.drawMs){set({waterQuest:{...q,phase:'carrying',phaseAt:now},action:'carryWater'});s.notify('Nước đã sẵn sàng. Gánh về một trong bốn lu sau nhà ăn nhé.');}return;
    }
    if(q.phase==='pouring'){
      if(q.jar===null||s.action!=='pourWater'||!nearWaterJar(s.position,q.jar)){set({waterQuest:{...q,phase:'carrying',phaseAt:now,jar:null},action:'carryWater'});s.notify('Chưa giao nước. Mang gánh đến gần miệng lu rồi thử lại nhé.');return;}
      if(now-q.phaseAt<WATER_TASK.pourMs)return;
      if(sharedActivityBlocked(s)){set({waterQuest:{...q,phase:'carrying',phaseAt:now,jar:null},action:'carryWater'});return;}
      const units=jarUnits(s.waterJars[q.jar],now);if(units>=WATER_TASK.jarCapacity){set({waterQuest:{...q,phase:'carrying',phaseAt:now,jar:null},action:'carryWater'});s.notify('Lu vừa đầy. Mời bạn chọn lu khác.');return;}
      if(s.connection==='online'){
        if(deliveryPending)return;deliveryPending=true;const room=s.room,jar=q.jar;
        void submitWorld({kind:'water',jar,operation:createClientId()}).then(()=>{const current=get();if(current.room!==room)return;set({waterQuest:null,lastWaterDeliveryAt:Date.now(),action:'walk',destination:null,pendingActivity:null});current.record('carryWater');current.notify('Đã giao nước vào lu chung. Cảm ơn đôi vai chăm chỉ!');}).catch(e=>{const current=get();if(current.room===room){set({waterQuest:{...q,phase:'carrying',phaseAt:Date.now(),jar:null},action:'carryWater'});current.notify(e.message);}}).finally(()=>{deliveryPending=false;});return;
      }
      const jars=WATER_JARS.map(j=>j.id===q.jar?{units:units+1,at:now}:s.waterJars[j.id]||{units:0,at:now});
      // Clear the trip before awarding: another tick/click cannot pay the same delivery twice.
      set({waterQuest:null,waterJars:jars,lastWaterDeliveryAt:now,action:'walk',destination:null,pendingActivity:null});s.record('carryWater');s.notify(`Đã giao nước cho bếp chay. +${WATER_TASK.reward} công đức. Cảm ơn đôi vai chăm chỉ!`);
    }
  },
};}
