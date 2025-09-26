import {
  MeshPhysicalMaterial,
  type MeshPhysicalMaterialParameters,
} from 'three';

export const createMaterial = (parameters: MeshPhysicalMaterialParameters) => {
  const material = new MeshPhysicalMaterial(parameters);
  (material as any).defines = {
    STANDARD: '',
    PCF_SAMPLES: 16,
    BLOCKER_SAMPLES: 16,
  };
  return material;
};
