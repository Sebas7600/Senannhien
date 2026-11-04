import {useState} from 'react';
import {ArrowRight,Flower2} from 'lucide-react';
import {useGame} from './gameStore';
import {LanternArt} from './RitualArt';
const draftKey='sen-wish-draft';
export default function WishPanel(){
  const s=useGame(),[text,setText]=useState(()=>{try{return sessionStorage.getItem(draftKey)||''}catch{return ''}});
  const update=(value:string)=>{setText(value);try{sessionStorage.setItem(draftKey,value)}catch{/* Draft still works in memory. */}};
  const send=()=>{s.releaseWish(text);if(useGame.getState().ceremony?.type==='lantern'){try{sessionStorage.removeItem(draftKey)}catch{}}};
  return <div className="wish-compose">
    <div className="wish-scene"><div className="wish-moon"/><div className="wish-stars"/><LanternArt/><span>MỘT ÁNH ĐÈN · MỘT LỜI LÀNH</span></div>
    <div className="wish-invitation"><Flower2 size={17}/><p>Gửi lại hồ sen một điều bạn mong ước.<br/>Để lòng nhẹ hơn, dù chỉ một chút.</p></div>
    <label className="field-label wish-label" htmlFor="wish-text">Lời nguyện của bạn</label>
    <textarea id="wish-text" value={text} onChange={e=>update(e.target.value)} maxLength={160} placeholder="Cầu mong mọi người đều được bình an…" rows={3} aria-describedby="wish-count wish-privacy"/>
    <div className="wish-footer"><span id="wish-count">{text.length}/160 ký tự<br/><b>Còn {s.inventory.lantern} hoa đăng</b></span>{s.inventory.lantern>0?<button className="button primary" disabled={!!s.ceremony} onClick={send}>Thả hoa đăng<ArrowRight size={17}/></button>:<button className="button primary" onClick={()=>s.set({panel:'bag'})}>Đổi thêm hoa đăng<ArrowRight size={17}/></button>}</div>
    <p id="wish-privacy" className="wish-privacy">Lời nguyện chỉ lưu trên trình duyệt của bạn.</p>
    {s.wishes.length>0&&<details className="past-wishes"><summary>Những lời đã gửi <span>{s.wishes.length}</span></summary>{s.wishes.slice(0,5).map(w=><p key={w.at}>{w.text}</p>)}</details>}
  </div>;
}
