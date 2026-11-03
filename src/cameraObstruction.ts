import {useEffect,type RefObject} from 'react';
import type {Mesh,Object3D} from 'three';
export const cameraOccluders:Object3D[]=[];
export function useCameraOccluder(ref:RefObject<Mesh>){useEffect(()=>{const object=ref.current;if(!object)return;cameraOccluders.push(object);return()=>{const index=cameraOccluders.indexOf(object);if(index>=0)cameraOccluders.splice(index,1)}},[ref]);}
