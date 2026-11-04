import * as T from 'three';
import {coloredGeometry as colored,batchGeometry,taperTube} from './geometryBatch';
import {treeBasinParts} from './treeBasinGeometry';
const cube=(p:[number,number,number],s:[number,number,number],c:string)=>colored(new T.BoxGeometry(1,1,1),c,p,s);
export const wellStoneGeometry=batchGeometry(treeBasinParts(1.14,.94,18));
const frame:T.BufferGeometry[]=[];
for(const x of [-.99,.99]){frame.push(cube([x,1.38,0],[.12,2.55,.16],'#806540'));frame.push(cube([x,.16,0],[.27,.22,.32],'#a5a397'));}
frame.push(cube([0,2.53,0],[2.38,.16,.21],'#8d7046'));
frame.push(colored(new T.CylinderGeometry(.075,.075,2.16,12),'#9d8155',[0,1.99,0],[1,1,1],[0,0,Math.PI/2]));
frame.push(cube([1.16,1.84,0],[.07,.34,.07],'#775c3c'),cube([1.28,1.68,0],[.27,.065,.065],'#9f8556'));
export const wellFrameGeometry=batchGeometry(frame);
export const wellRopeGeometry=batchGeometry([
  ...Array.from({length:6},(_,i)=>colored(new T.TorusGeometry(.088,.013,4,12),'#bca67b',[-.1+i*.038,1.99,0],[1,1,1],[0,Math.PI/2,0])),
]);
export const wellRopeLineGeometry=colored(new T.CylinderGeometry(.014,.014,1,6),'#bca67b');
const jarProfile=[[0,0],[.28,0],[.42,.1],[.57,.48],[.56,.76],[.44,1.01],[.36,1.06],[.38,1.12],[.31,1.12],[.3,1.06],[.37,.98],[.49,.74],[.5,.49],[.33,.15],[0,.14]];
const jar=new T.LatheGeometry(jarProfile.map(([r,y])=>new T.Vector2(r,y)),18),p=jar.attributes.position,colors=new Float32Array(p.count*3);
for(let i=0;i<p.count;i++){const y=p.getY(i),n=.93+.05*Math.sin(p.getX(i)*63+y*31)+.025*Math.sin(y*210),c=new T.Color(y>1.04?'#65462f':y>.82&&y<.87?'#b09063':'#946a47').multiplyScalar(n);colors.set([c.r,c.g,c.b],i*3);}
jar.setAttribute('color',new T.BufferAttribute(colors,3));jar.computeBoundingBox();jar.computeBoundingSphere();export const waterJarGeometry=jar;
export const waterDiscGeometry=new T.CircleGeometry(1,18).rotateX(-Math.PI/2);

export const yokeWoodGeometry=batchGeometry([
  colored(taperTube([[0,0,-1.05],[0,.055,-.5],[0,.035,0],[0,.055,.5],[0,0,1.05]],[.021,.027,.03,.027,.021],7),'#b89b58'),
  ...[-1,1].flatMap(side=>[
    colored(new T.CylinderGeometry(.009,.009,.59,5),'#b7a075',[0,-.31,side*.99]),
    colored(new T.TorusGeometry(.16,.01,4,12,Math.PI),'#b7a075',[0,-.65,side*.99]),
  ]),
]);
const bucketProfile=[[0,-.85],[.125,-.85],[.17,-.56],[.17,-.54],[.15,-.54],[.11,-.83],[0,-.83]];
export const wellBucketGeometry=batchGeometry([
  colored(new T.LatheGeometry(bucketProfile.map(([r,y])=>new T.Vector2(r,y)),12),'#9aaca5',[0,.85,0]),
  colored(new T.TorusGeometry(.167,.013,4,12),'#c5cec4',[0,.30,0],[1,1,1],[Math.PI/2,0,0]),
  colored(new T.TorusGeometry(.16,.01,4,12,Math.PI),'#b7a075',[0,.20,0]),
]);
export const yokeBucketGeometry=batchGeometry([-1,1].flatMap(side=>[
  colored(new T.LatheGeometry(bucketProfile.map(([r,y])=>new T.Vector2(r,y)),12),'#9aaca5',[0,0,side*.99]),
  colored(new T.TorusGeometry(.167,.013,4,12),'#c5cec4',[0,-.55,side*.99],[1,1,1],[Math.PI/2,0,0]),
]));
export const yokeWaterGeometry=batchGeometry([-1,1].map(side=>colored(waterDiscGeometry,'#6b9d91',[0,-.6,side*.99],[.145,1,.145])));
export const wellStoneMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.98});
export const wellWoodMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.85});
export const jarMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.54,metalness:.04});
export const waterMaterial=new T.MeshStandardMaterial({color:'#759e92',roughness:.23,metalness:.08});
export const bucketMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.32});
