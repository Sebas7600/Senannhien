import {memo} from 'react';
import {benchGeometry,type BenchLOD} from './benchGeometry';
import {terrazzoMaterial,type BenchFinish} from './terrazzo';
function VietnameseBench({finish='jade',lod='near'}:{finish?:BenchFinish;lod?:BenchLOD}){return <mesh name={`Ghe-da-Viet-Nam-${finish}`} geometry={benchGeometry(lod)} material={terrazzoMaterial(finish,lod)} castShadow receiveShadow dispose={null}/>}
export default memo(VietnameseBench);
