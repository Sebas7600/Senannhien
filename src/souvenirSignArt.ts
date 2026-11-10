/** Quiet timber shop signs, painted once into the existing shared atlas. */
export function drawSouvenirPlaque(c:CanvasRenderingContext2D,title:string,accent:string,subtitle:string){
 c.save();c.scale(1,2);
 const timber=c.createLinearGradient(0,0,0,128);timber.addColorStop(0,'#493b2e');timber.addColorStop(.45,'#352c24');timber.addColorStop(1,'#2c251f');
 c.fillStyle='#2c251f';c.fillRect(0,0,512,128);
 c.fillStyle='#76634c';c.fillRect(2,2,508,124);
 c.fillStyle=timber;c.fillRect(5,5,502,118);
 // Subtle long grain and an inset edge, without the ceremonial gold frame.
 c.save();c.beginPath();c.rect(6,6,500,116);c.clip();c.lineWidth=.6;
 for(let i=0;i<20;i++){
  const y=9+i*6;c.strokeStyle=i%3?'rgba(211,185,143,.045)':'rgba(12,10,8,.12)';
  c.beginPath();c.moveTo(0,y);c.bezierCurveTo(125,y-2.5,360,y+3,512,y-.8);c.stroke();
 }
 c.restore();
 c.strokeStyle='rgba(196,174,139,.22)';c.lineWidth=.65;c.strokeRect(11,11,490,106);
 // A small fabric-coloured maker's seal ties each sign to its own noren.
 c.fillStyle=accent;c.beginPath();c.roundRect(24,22,52,84,3);c.fill();
 c.strokeStyle='rgba(240,230,204,.28)';c.lineWidth=.6;c.strokeRect(28,26,44,76);
 c.save();c.translate(50,64);c.strokeStyle='#d7cfb7';c.lineWidth=1.4;c.lineCap='round';c.lineJoin='round';
 c.beginPath();c.moveTo(0,9);c.bezierCurveTo(-12,-1,-10,-13,0,-20);c.bezierCurveTo(10,-13,12,-1,0,9);
 for(const side of [-1,1]){c.moveTo(0,9);c.bezierCurveTo(side*17,11,side*21,-1,side*19,-8);c.bezierCurveTo(side*8,-7,side*3,0,0,9);}
 c.moveTo(-15,15);c.quadraticCurveTo(0,21,15,15);c.stroke();c.restore();
 const label=title.toLocaleLowerCase('vi-VN').replace(/^./,letter=>letter.toLocaleUpperCase('vi-VN'));
 c.textAlign='center';c.textBaseline='middle';c.font='600 34px "Palatino Linotype","Book Antiqua",Georgia,serif';
 const fontSize=Math.min(34,34*354/c.measureText(label).width);c.font=`600 ${fontSize}px "Palatino Linotype","Book Antiqua",Georgia,serif`;
 c.fillStyle='rgba(12,10,8,.55)';c.fillText(label,285,55);c.fillStyle='#e5ddc8';c.fillText(label,285,54);
 c.font='12px "Segoe UI",sans-serif';c.fillStyle='#b6aa92';c.fillText(subtitle,285,84,352);
 c.restore();
}
