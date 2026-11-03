// Resonance peaks measured in J's reference clip; musical background is excluded.
export const BOWL_SAMPLE_RATE=22050,BOWL_SECONDS=6.4;
export const BOWL_MODES=[
  [863.6,1,3.6],[866.1,.31,3.1],[2347.1,.30,1.9],[2360.6,.10,1.5],[4297.2,.075,.85],[6618.8,.023,.4],
] as const;
export function renderBowlSamples(){
  const dry=new Float32Array(Math.ceil(BOWL_SAMPLE_RATE*BOWL_SECONDS)),out=new Float32Array(dry.length);let seed=4021,noise=0;
  for(let i=0;i<dry.length;i++){const t=i/BOWL_SAMPLE_RATE,attack=1-Math.exp(-t/ .0035);let value=0;
    for(let k=0;k<BOWL_MODES.length;k++){const[f,a,decay]=BOWL_MODES[k];value+=a*Math.sin(2*Math.PI*f*t+k*.17)*Math.exp(-t/decay)}
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise=noise*.46+(seed/4294967296*2-1)*.54;
    value=value*attack*(.96+.04*Math.cos(t*2*Math.PI*.7))+noise*.17*Math.exp(-t/.012);
    dry[i]=value;
  }
  let peak=0;const a=Math.round(.031*BOWL_SAMPLE_RATE),b=Math.round(.067*BOWL_SAMPLE_RATE);
  for(let i=0;i<out.length;i++){const t=i/BOWL_SAMPLE_RATE,fade=Math.min(1,(BOWL_SECONDS-t)/.5);out[i]=(dry[i]+(i>a?dry[i-a]*.12:0)+(i>b?dry[i-b]*.065:0))*fade;peak=Math.max(peak,Math.abs(out[i]))}
  for(let i=0;i<out.length;i++)out[i]*=.72/peak;return out;
}
