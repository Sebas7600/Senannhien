export const DRUM_SAMPLE_RATE=22050;
/** Membrane modes, a brief skin attack and diffuse room reflections, cached locally. */
export function renderDrumSamples(){
  const samples=new Float32Array(Math.ceil(DRUM_SAMPLE_RATE*2.8));let noise=9187,peak=0;
  for(let i=0;i<samples.length;i++){
    const t=i/DRUM_SAMPLE_RATE;noise=(Math.imul(noise,1664525)+1013904223)|0;
    let value=(noise/2147483648)*.32*Math.exp(-t*65);
    for(const [frequency,level,decay] of [[72,1,2.1],[118,.43,3.4],[165,.25,5],[247,.12,7],[386,.045,10]]){
      value+=level*(wave(t,frequency,decay)+.16*wave(t-.071,frequency,decay)+.1*wave(t-.127,frequency,decay)+.06*wave(t-.213,frequency,decay));
    }
    value*=Math.min(1,(2.8-t)/.15);samples[i]=value;peak=Math.max(peak,Math.abs(value));
  }
  for(let i=0;i<samples.length;i++)samples[i]*=.85/Math.max(peak,.001);
  return samples;
}

function wave(time:number,frequency:number,decay:number){return time<0?0:Math.sin(2*Math.PI*(frequency*time+2.1*(1-Math.exp(-time*35))))*Math.exp(-time*decay)*(1-Math.exp(-time*180));}
