import {
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type MeshPhysicalMaterialParameters,
} from 'three';
import { settings } from '../store/settings';

export const createMaterial = (parameters: MeshPhysicalMaterialParameters) => {
  const material = settings.highDetail
    ? new MeshPhysicalMaterial(parameters)
    : new MeshStandardMaterial(parameters);
  (material as any).defines = {
    STANDARD: '',
    PCF_SAMPLES: 16,
    BLOCKER_SAMPLES: 16,
  };
  return material;
};
