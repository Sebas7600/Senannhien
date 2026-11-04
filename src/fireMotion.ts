/** Bounded, continuous, deterministic flicker: no random allocations in the render loop. */
export function flameFlicker(seconds:number,seed=0,reduced=false){
  return reduced?1:1+.075*Math.sin(seconds*8.1+seed)+.04*Math.sin(seconds*13.7+seed*2)+.025*Math.sin(seconds*3.9+seed*.7);
}
