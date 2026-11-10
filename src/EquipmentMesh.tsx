import {equipmentGeometry,equipmentMaterial} from './equipmentGeometry';
import type {SouvenirId} from './souvenirData';
export default function EquipmentMesh({id}:{id:SouvenirId}){return <mesh name={'equipment-'+id} geometry={equipmentGeometry(id)} material={equipmentMaterial} dispose={null}/>;}
