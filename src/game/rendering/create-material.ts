import {
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type MeshPhysicalMaterialParameters,
} from 'three';
import { properties } from '../physics/properties';

export const createMaterial = (parameters: MeshPhysicalMaterialParameters) => {
  const material = properties.highDetail
    ? new MeshPhysicalMaterial(parameters)
    : new MeshStandardMaterial(parameters);
  (material as any).defines = {
    STANDARD: '',
    PCF_SAMPLES: 16,
    BLOCKER_SAMPLES: 16,
  };
  return material;
};
