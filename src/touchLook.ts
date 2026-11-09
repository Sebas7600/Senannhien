/** One pointer owns looking until release. A second finger never becomes zoom. */
export class TouchLookGesture {
  private owner:number|null=null;
  private x=0;private y=0;
  begin(id:number,x:number,y:number){if(this.owner!==null)return false;this.owner=id;this.x=x;this.y=y;return true;}
  move(id:number,x:number,y:number){
    if(id!==this.owner)return null;
    const yaw=-(x-this.x)*.005,pitch=-(y-this.y)*.005;this.x=x;this.y=y;
    return {yaw:Math.max(-.35,Math.min(.35,yaw)),pitch:Math.max(-.25,Math.min(.25,pitch))};
  }
  end(id:number){if(id===this.owner)this.owner=null;}
  clear(){this.owner=null;}
}
export const touchLookDelta={yaw:0,pitch:0};
