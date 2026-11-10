export interface FireworkVolley {at:number;count:number}

/** A single opening shell, then mixed three/five-shell volleys with a ten-tube minute salute. */
export function fireworkVolleySchedule(duration=300,minute=60,gap=2.8):FireworkVolley[]{
  const schedule:FireworkVolley[]=[];
  if(duration<=0||minute<=0||gap<=0)return schedule;
  for(let minuteStart=0;minuteStart<duration;minuteStart+=minute){
    if(minuteStart===0){
      for(const [index,count] of [1,3,5].entries()){
        const at=.7+index*gap;
        if(at<duration&&at<minute)schedule.push({at,count});
      }
      let at=.7+3*gap,index=0;
      while(at<duration&&at<minute){schedule.push({at,count:index%2===0?3:5});at+=gap;index++;}
    }else{
      schedule.push({at:minuteStart,count:10});
      let at=minuteStart+gap,index=0;
      while(at<duration&&at<minuteStart+minute){schedule.push({at,count:index%2===0?3:5});at+=gap;index++;}
    }
  }
  return schedule;
}
