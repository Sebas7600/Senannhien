import * as T from 'three';
import {coloredGeometry as colored,batchGeometry,taperTube} from './geometryBatch';
export const wellRopeLineGeometry=colored(new T.CylinderGeometry(.014,.014,1,6),'#bca67b');
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
export const wellWoodMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.85});
export const wellDepthMaterial=new T.MeshBasicMaterial({color:'#172c26'});
export const waterMaterial=new T.MeshStandardMaterial({color:'#51796f',roughness:.23,metalness:.08});
export const bucketMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.32});
