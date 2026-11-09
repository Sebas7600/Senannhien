import {useEffect,useRef} from 'react';
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp} from 'lucide-react';
export default function Joystick(){
  const owner=useRef<number|null>(null),stick=useRef<HTMLSpanElement>(null);
  const send=(x:number,y:number)=>{if(stick.current)stick.current.style.transform=`translate(${x}px,${y}px)`;window.dispatchEvent(new CustomEvent('sen-joystick',{detail:{x:x/27,y:y/27}}));};
  const stop=()=>{owner.current=null;send(0,0);};
  useEffect(()=>{window.addEventListener('blur',stop);const hide=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',hide);return()=>{window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hide);send(0,0);}},[]);
  const move=(e:React.PointerEvent<HTMLDivElement>)=>{if(e.pointerId!==owner.current)return;const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,n=Math.max(1,Math.hypot(x,y)/27);send(x/n,y/n);};
  return <div className="joystick" role="group" aria-label="Cần điều khiển di chuyển" style={{touchAction:'none'}}
    onPointerDown={e=>{e.stopPropagation();if(owner.current!==null)return;owner.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e)}}
    onPointerMove={e=>{e.stopPropagation();move(e)}}
    onPointerUp={e=>{e.stopPropagation();if(e.pointerId===owner.current)stop()}}
    onPointerCancel={e=>{if(e.pointerId===owner.current)stop()}} onLostPointerCapture={e=>{if(e.pointerId===owner.current)stop()}}>
    <span ref={stick}/><ArrowUp className="joy-up" size={13}/><ArrowDown className="joy-down" size={13}/><ArrowLeft className="joy-left" size={13}/><ArrowRight className="joy-right" size={13}/>
  </div>;
}
