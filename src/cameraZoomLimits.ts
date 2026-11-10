import {useEffect,useState} from 'react';

export const OVERVIEW_ZOOM_MIN=20;
export const DESKTOP_OVERVIEW_ZOOM_MAX=190;
export const MOBILE_OVERVIEW_ZOOM_MAX=380;

const COMPACT_VIEW_QUERY='(max-width:760px),(max-width:1100px) and (pointer:coarse),(max-width:960px) and (max-height:500px)';

export function clampOverviewZoom(value:number,max:number){
  return Math.max(OVERVIEW_ZOOM_MIN,Math.min(max,value));
}

export function useOverviewZoomMax(){
  const [max,setMax]=useState(()=>typeof window==='undefined'||window.matchMedia(COMPACT_VIEW_QUERY).matches?MOBILE_OVERVIEW_ZOOM_MAX:DESKTOP_OVERVIEW_ZOOM_MAX);
  useEffect(()=>{
    const query=window.matchMedia(COMPACT_VIEW_QUERY),update=()=>setMax(query.matches?MOBILE_OVERVIEW_ZOOM_MAX:DESKTOP_OVERVIEW_ZOOM_MAX);
    update();query.addEventListener('change',update);
    return()=>query.removeEventListener('change',update);
  },[]);
  return max;
}
