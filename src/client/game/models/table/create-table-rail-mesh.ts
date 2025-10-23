import type { Vec } from '@common/math';
import { Mesh } from 'three';
import type { Params } from '../../../../common/simulation/physics';
import { createMaterial } from '../../rendering/create-material';
import type { ThemeObject } from '../../store/theme';
import { createTableRailGeometry } from './create-table-rail-geometry';

export const createTableRailMesh = (
  params: Params,
  pockets: { position: Vec; radius: number }[],
  theme: ThemeObject
) => {
  const rail = createTableRailGeometry(params, pockets);

  const mesh = new Mesh(
    rail,
    createMaterial({
      color: theme.table.colorRail,
      roughness: 0.2,
      metalness: 0.4,
    })
  );
  mesh.receiveShadow = true;
  return mesh;
};
