import {useId} from 'react';

export function LanternArt(){const id=useId().replace(/:/g,'');return <svg className="lantern-illustration" viewBox="0 0 400 260" fill="none" aria-hidden="true">
  <defs><radialGradient id={`${id}-light`}><stop stopColor="#efd49a" stopOpacity=".45"/><stop offset="1" stopColor="#efd49a" stopOpacity="0"/></radialGradient><linearGradient id={`${id}-silk`} x1="147" y1="60" x2="250" y2="190" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1c8"/><stop offset=".55" stopColor="#ecd19b"/><stop offset="1" stopColor="#c9a574"/></linearGradient></defs>
  <circle cx="200" cy="120" r="118" fill={`url(#${id}-light)`}/>
  <g className="paper-lantern">
    <path d="M200 39V26" stroke="#be9c67" strokeWidth="2"/>
    <path d="M200 42C146 44 130 82 151 119C166 147 181 165 187 190H213C219 165 234 147 249 119C270 82 254 44 200 42Z" fill={`url(#${id}-silk)`} stroke="#b6935f" strokeWidth="2"/>
    {[-1,1].flatMap(side=>[.33,.66,1].map((v,i)=><path key={`${side}-${i}`} d={`M200 42C${200+side*57*v} 67 ${200+side*47*v} 107 ${200+side*21*v} 150L${200+side*13*v} 190`} stroke="#a48759" strokeWidth="1.3" opacity=".75"/>))}
    <path d="M200 43V190" stroke="#b39b6b"/>
    <path d="M191 159L205 77M199 109L220 93M197 123L178 108M202 97L188 85M194 143L214 124" stroke="#6a7955" strokeWidth="3" strokeLinecap="round"/>
    <path d="M204 109Q224 99 229 86Q214 91 204 109ZM196 126Q176 118 173 105Q184 108 196 126ZM193 145Q215 138 221 122Q204 128 193 145Z" fill="#7a875d"/>
    <path d="M191 41H209M188 191H212" stroke="#927344" strokeWidth="5" strokeLinecap="round"/>
    <path d="M200 195V218" stroke="#c4a468" strokeWidth="2"/><circle cx="200" cy="219" r="4" fill="#b8955c"/><path d="M200 223L193 243H207Z" fill="#c7a56b"/>
  </g>
</svg>}

/** Lightweight vector illustrations stay crisp on tablets and need no image downloads. */
export function LotusArt({small=false}:{small?:boolean}) {
  const id=useId().replace(/:/g,'');
  return <svg className={`lotus-illustration ${small?'small':''}`} viewBox="0 0 400 260" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-halo`}><stop stopColor="#f5d58b" stopOpacity=".65"/><stop offset="1" stopColor="#f5d58b" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-petal`} x1="200" y1="85" x2="200" y2="190" gradientUnits="userSpaceOnUse"><stop stopColor="#fff2d2"/><stop offset=".5" stopColor="#edbeaa"/><stop offset="1" stopColor="#ce8a88"/></linearGradient>
      <linearGradient id={`${id}-water`} x1="100" y1="180" x2="300" y2="240"><stop stopColor="#4e7d75"/><stop offset="1" stopColor="#213f47"/></linearGradient>
    </defs>
    <circle cx="200" cy="132" r="122" fill={`url(#${id}-halo)`}/>
    <ellipse cx="200" cy="210" rx="156" ry="29" stroke="#8daba0" strokeOpacity=".28"/>
    <ellipse cx="200" cy="209" rx="127" ry="23" stroke="#b3bc92" strokeOpacity=".5"/>
    <ellipse cx="200" cy="204" rx="103" ry="26" fill={`url(#${id}-water)`}/>
    <ellipse className="lotus-ripple" cx="200" cy="203" rx="90" ry="19" stroke="#d9d4a5" strokeOpacity=".55"/>
    <g className="lotus-bloom">
      <ellipse cx="200" cy="185" rx="64" ry="14" fill="#8d9b72"/>
      {[-68,-44,-23,0,23,44,68].map((angle,i)=><path key={angle} d="M200 185 C160 153 170 111 200 76 C230 111 240 153 200 185Z" transform={`rotate(${angle} 200 185)`} fill={`url(#${id}-petal)`} stroke="#be8e7b" strokeWidth="1.2"/>)}
      {[-38,-18,18,38].map(angle=><path key={angle} d="M200 185 Q174 156 200 112 Q226 156 200 185Z" transform={`rotate(${angle} 200 185)`} fill={`url(#${id}-petal)`} stroke="#cf9c83"/>) }
      <ellipse cx="200" cy="173" rx="15" ry="8" fill="#e8ca83"/>
      <path className="lotus-flame" d="M200 170 C182 158 201 150 198 136 C218 153 213 166 200 170Z" fill="#fff0b2"/>
    </g>
    {[[-77,30],[-49,-30],[42,-8],[70,45],[-20,-62],[20,15]].map(([x,y],i)=><circle className="lotus-spark" key={i} cx={200+x} cy={117+y} r={i%2?2:3} fill="#e8cb88" style={{animationDelay:`${i*.3}s`}}/>)}
  </svg>;
}

export function TeaArt(){return <svg className="tea-illustration" viewBox="0 0 360 240" fill="none" aria-hidden="true">
  <circle cx="180" cy="130" r="96" fill="#e6e9d5"/>
  <ellipse cx="180" cy="204" rx="90" ry="10" fill="#c0c6a5" opacity=".4"/>
  <g className="tea-cup">
    <path d="M229 127 C281 108 283 173 234 174" stroke="#62764e" strokeWidth="7"/>
    <path d="M112 120 Q115 196 180 196 Q242 196 248 120Z" fill="#9eaf7a" stroke="#62764e" strokeWidth="3"/>
    <path d="M125 132 Q131 176 154 181" stroke="#ecedcb" strokeWidth="5" strokeLinecap="round"/>
    <ellipse cx="180" cy="120" rx="68" ry="13" fill="#dfe4c4" stroke="#62764e" strokeWidth="3"/>
    <ellipse cx="180" cy="122" rx="55" ry="7" fill="#8e9e65"/>
    <path d="M111 195 Q180 217 248 195 L239 203 Q180 227 120 203Z" fill="#78895b"/>
  </g>
  {[145,178,211].map((x,i)=><path key={x} className="tea-steam" d={`M${x} 99 C${x-18} 79 ${x+18} 69 ${x} 49`} stroke="#84946a" strokeWidth="3" strokeLinecap="round" style={{animationDelay:`${i*.5}s`}}/>)}
</svg>}

export function ChantArt(){return <svg className="chant-illustration" viewBox="0 0 440 250" fill="none" aria-hidden="true">
  <rect width="440" height="250" rx="20" fill="#e1d7bc"/>
  <path d="M0 150L440 119V250H0Z" fill="#c3a77d"/>
  <path d="M0 177L440 145M0 218L440 186M130 151L120 250M338 136L330 250" stroke="#ab8e68" strokeWidth="2" opacity=".5"/>
  {[45,86,365].map((x,i)=><g key={x}><rect x={x} y={62-i*7} width="15" height="55" rx="3" fill="#f4e9c5"/><path className="candle-glow" d={`M${x+7} ${59-i*7}q-12 -10 0 -22q12 12 0 22`} fill="#e9c37e"/></g>)}
  <path d="M49 162Q95 144 163 161L184 222Q118 202 65 223Z" fill="#f8f1d8" stroke="#8c8064" strokeWidth="2"/>
  <path d="M163 161Q211 140 244 154L266 211Q214 208 184 222Z" fill="#efe6c8" stroke="#8c8064" strokeWidth="2"/>
  {[0,1,2,3,4,5,6].map(i=><path key={i} d={`M${67+i*12} 166L${80+i*12} 207 M${178+i*9} 165L${191+i*9} 204`} stroke="#a3a08a" strokeWidth="3" strokeDasharray="3 4"/>)}
  <ellipse cx="298" cy="172" rx="59" ry="37" fill="#aa7e51" stroke="#815f3e" strokeWidth="2"/>
  <path d="M250 166Q292 126 340 164M253 179Q299 151 342 179" stroke="#785638" strokeWidth="3"/>
  <path d="M317 169L386 213" stroke="#8d6844" strokeWidth="10" strokeLinecap="round"/>
  <ellipse cx="251" cy="129" rx="25" ry="6" fill="#ac8c68"/><ellipse cx="251" cy="125" rx="21" ry="5" stroke="#746a4a"/>
  {[0,1,2].map(i=><path key={i} className="incense-smoke" d="M251 117C223 100 278 83 251 58C234 44 261 30 254 15" stroke="#f9f5e9" strokeWidth="2" strokeLinecap="round" style={{animationDelay:`${i*1.2}s`}}/>)}
</svg>}

export function BellArt(){return <svg className="bell-illustration" viewBox="0 0 360 250" fill="none" aria-hidden="true">
  <circle cx="180" cy="133" r="103" fill="#dce2c6"/>
  <path d="M80 225H280M93 217H267" stroke="#71432c" strokeWidth="12"/>
  {[95,265].map(x=><g key={x}><path d={`M${x} 35V217`} stroke="#76422d" strokeWidth="17"/><path d={`M${x-4} 52V202`} stroke="#b78353" strokeWidth="2"/>{[66,196].map(y=><path key={y} d={`M${x-9} ${y}q-15 -20 7 -18q19 4 5 19`} stroke="#a46b42" strokeWidth="4"/>)}</g>)}
  <path d="M75 34Q180 18 285 34V48H75Z" fill="#79422c"/>
  <path d="M108 49L131 73M252 49L229 73" stroke="#805034" strokeWidth="9"/>
  <path d="M180 45V65" stroke="#a18a58" strokeWidth="5"/>
  <g className="reflection-bell">
    <path d="M180 81q-32-28-19-29q19-3 19 16q0-19 19-16q13 1-19 29" stroke="#665438" strokeWidth="7"/>
    <path d="M123 117Q127 81 180 80Q233 81 237 117L239 189L249 202Q180 219 111 202L121 189Z" fill="#39352c" stroke="#a08a5a" strokeWidth="3"/>
    {[118,135,177,187,202].map(y=><path key={y} d={`M${y>190?115:123} ${y}Q180 ${y+8} ${y>190?245:237} ${y}`} stroke="#b9a16c" strokeWidth="2"/>)}
    {[145,180,215].map(x=><g key={x}><rect x={x-12} y="143" width="24" height="27" rx="5" stroke="#b9a16c"/>{[0,1,2,3].map(i=><ellipse key={i} cx={x} cy="156" rx="4" ry="9" transform={`rotate(${i*45} ${x} 156)`} stroke="#b9a16c"/>)}</g>)}
    <circle cx="180" cy="186" r="8" fill="#b9a16c"/>
  </g>
</svg>}

export function BookArt(){return <svg className="book-illustration" viewBox="0 0 160 100" fill="none" aria-hidden="true"><path d="M17 25Q49 14 80 31Q111 14 143 25V79Q110 69 80 85Q49 69 17 79Z" fill="#f1e8cc" stroke="#83906d" strokeWidth="2"/><path d="M80 31V85" stroke="#83906d"/><path className="turning-page" d="M80 31Q111 14 143 25V79Q110 69 80 85Z" fill="#fffae9" stroke="#b9be9c"/>{[0,1,2,3].map(i=><path key={i} d={`M28 ${36+i*9}Q49 ${29+i*9} 67 ${39+i*9}`} stroke="#b2b293" strokeWidth="2"/>)}</svg>}
