import type {Object3D} from 'three';
/** Render-space transform stays outside React/persistence. Physics interpolates it every frame. */
export const playerMotion:{object:Object3D|null;heading:number;moving:boolean}={object:null,heading:Math.PI,moving:false};
export const performanceStats={fps:0,p95:0,frames:0,storageWrites:0};
