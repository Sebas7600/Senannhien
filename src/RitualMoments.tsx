import {unlockAudio} from './audio';
import {Check, Flower2, Wind, Volume2, VolumeX} from 'lucide-react';
import {useGame, type Reflection} from './gameStore';
import {BellArt, ChantArt, LotusArt, TeaArt} from './RitualArt';

export const reflectionTitles:Record<Reflection,string>={teaMoment:'Một tách trà an nhiên',chantMoment:'Nhất tâm tụng niệm',bellMoment:'Dư âm tiếng chuông',lanternMoment:'Lời nguyện theo ánh sen'};

export function RitualMoment({kind}:{kind:Reflection}) {
  const sound=useGame(s=>s.sound&&s.chantMusic);
  const close=useGame(s=>s.closePanel),wish=useGame(s=>s.reflectionWish);
  return <div className={`moment-body ${kind}`}>
    <div className="moment-art">{kind==='teaMoment'?<TeaArt/>:kind==='chantMoment'?<ChantArt/>:kind==='bellMoment'?<BellArt/>:<LotusArt/>}</div>
    <span className="moment-kicker">{kind==='teaMoment'?'TRÀ ĐÌNH VỌNG SƠN':kind==='chantMoment'?'THIỀN ĐƯỜNG TRÚC LÂM':kind==='bellMoment'?'LẦU CHUÔNG':'HỒ SEN NGUYỆN ƯỚC'}</span>
    <h3>{kind==='teaMoment'?<>Chén trà trong tay,<br/>tâm buông vạn bận</>:kind==='chantMoment'?<>Nhất tâm tụng niệm,<br/>phiền não tự tiêu</>:kind==='bellMoment'?<>Lắng nghe tiếng chuông,<br/>để lòng được bình yên</>:<>Gửi gắm ước nguyện,<br/>tâm sáng bình an</>}</h3>
    {kind==='lanternMoment'?<blockquote className="sent-wish">“{wish}”</blockquote>:<p className="moment-description">{kind==='teaMoment'?'Nhấp một ngụm nhỏ. Cảm nhận hơi ấm đang về.':kind==='chantMoment'?'Nam mô Bổn Sư Thích Ca Mâu Ni Phật.':'Thở chậm một nhịp, nhẹ nhàng trở về với chính mình.'}</p>}
    {kind==='chantMoment'&&<button className="button ghost chant-audio" aria-pressed={sound} onClick={()=>{if(!sound){unlockAudio();useGame.getState().set({sound:true,chantMusic:true})}else useGame.getState().set({chantMusic:false})}}>{sound?<VolumeX size={17}/>:<Volume2 size={17}/>} {sound?'Tắt nhạc thời kinh':'Bật nhạc thời kinh'}</button>}
    <div className="moment-divider"><Flower2 size={17}/></div>
    <button className="button primary moment-close" onClick={close}>{kind==='chantMoment'?<Wind size={17}/>:<Check size={17}/>} {kind==='chantMoment'?'Khép lại thời kinh':kind==='lanternMoment'?'Mang bình an trở về':'Trở về với hiện tại'}</button>
    {kind==='lanternMoment'&&<small className="moment-footnote">Lời nguyện được lưu riêng trên trình duyệt này.</small>}
  </div>;
}
