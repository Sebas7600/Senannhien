import * as THREE from 'three';
let cache:{aggregate:THREE.CanvasTexture;lettering:THREE.CanvasTexture}|null=null;
export function benchTextures(){if(cache)return cache;
  const aggregateCanvas=document.createElement('canvas');aggregateCanvas.width=aggregateCanvas.height=512;
  const ctx=aggregateCanvas.getContext('2d')!,pixels=ctx.createImageData(512,512);let seed=78193;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  // R/G store pale/dark mineral coverage, B stores fine roughness variation.
  for(let i=0;i<512*512;i++){pixels.data[i*4]=0;pixels.data[i*4+1]=0;pixels.data[i*4+2]=110+Math.floor(random()*36);pixels.data[i*4+3]=255}ctx.putImageData(pixels,0,0);
  for(const cells of [40,15])for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){
    const step=512/cells,cx=(x+.22+random()*.56)*step,cy=(y+.22+random()*.56)*step,r=(cells===40?.12:.055)+random()*(cells===40?.20:.1),radius=r*step,angle=random()*Math.PI*2;
    const points=Array.from({length:5},(_,j)=>{const a=angle+j*Math.PI*2/5,rr=radius*(.65+random()*.5);return [Math.cos(a)*rr,Math.sin(a)*rr]});
    ctx.fillStyle=random()>.38?'rgb(153,0,156)':'rgb(0,132,103)';
    for(const dx of [-512,0,512])for(const dy of [-512,0,512]){if(cx+dx+radius<0||cx+dx-radius>512||cy+dy+radius<0||cy+dy-radius>512)continue;ctx.beginPath();points.forEach(([px,py],j)=>j?ctx.lineTo(cx+dx+px,cy+dy+py):ctx.moveTo(cx+dx+px,cy+dy+py));ctx.closePath();ctx.fill();}
  }
  const aggregate=new THREE.CanvasTexture(aggregateCanvas);aggregate.colorSpace=THREE.NoColorSpace;aggregate.wrapS=aggregate.wrapT=THREE.RepeatWrapping;aggregate.anisotropy=4;
  const letteringCanvas=document.createElement('canvas');letteringCanvas.width=1024;letteringCanvas.height=256;const print=letteringCanvas.getContext('2d')!;print.scale(2/3,2/3);
  print.fillStyle='#e3dfcb';print.beginPath();print.roundRect(12,12,1512,360,35);print.fill();print.strokeStyle='#aaa58b';print.lineWidth=3;print.beginPath();print.roundRect(25,25,1486,334,28);print.stroke();
  print.textAlign='center';print.fillStyle='#8a342b';print.font='600 120px "Segoe UI",Arial,sans-serif';print.fillText('SEN AN NHIÊN',768,172);print.font='500 48px "Segoe UI",Arial,sans-serif';print.fillText('MỘT CHÚT BÌNH YÊN',768,270);
  for(let i=0;i<1200;i++){print.fillStyle=i%3?'#766f5010':'#ffffff22';print.fillRect((i*113.71)%1536,(i*47.31)%384,1.8,1.8)}
  const lettering=new THREE.CanvasTexture(letteringCanvas);lettering.colorSpace=THREE.SRGBColorSpace;lettering.anisotropy=4;
  cache={aggregate,lettering};return cache;
}
