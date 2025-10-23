import type { ECS } from '@common/ecs';
import type { Params } from '@common/simulation/physics';
import type { MeshPhysicalMaterial } from 'three';
import type { GameEvents } from '../../events';
import { createTableClothGeometry } from '../../models/table/create-table-cloth-geometry';
import {
  createTableClothNormalTexture,
  createTableClothTexture,
} from '../../models/table/create-table-cloth-texture';
import { createTableRailGeometry } from '../../models/table/create-table-rail-geometry';
import { makeTheme } from '../../store/theme';
import { ParamUpdateSystem } from '../../systems/param-update.system';
import { Pocket } from './pocket.component';
import { TableMesh } from './table-mesh.component';

export class TableParamUpdateSystem extends ParamUpdateSystem {
  public test = (mutated: GameEvents['game/param-update']['mutated']) => {
    return mutated.includes('table');
  };

  public onChange(ecs: ECS<GameEvents, unknown>, params: Params): void {
    const { cloth, rail } = ecs.query().resolveFirst(TableMesh);
    const pockets = ecs
      .queryAll(Pocket)
      .map((entity) => ecs.get(entity, Pocket)[0]);
    const theme = makeTheme();

    cloth.geometry.dispose();
    cloth.geometry = createTableClothGeometry(params, pockets);
    const clothMaterial = cloth.material as MeshPhysicalMaterial;
    clothMaterial.map?.dispose();
    clothMaterial.map = createTableClothTexture(params, theme);
    clothMaterial.map.needsUpdate = true;
    clothMaterial.normalMap = createTableClothNormalTexture(params);

    rail.geometry.dispose();
    rail.geometry = createTableRailGeometry(params, pockets);
  }
}
