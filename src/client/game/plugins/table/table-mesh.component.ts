import { defaultParams } from '@common/simulation/physics';
import { warn } from '@common/util';
import { Mesh, Object3D } from 'three';
import { Renderable } from '../../components/renderable';
import { createTableClothMesh } from '../../models/table/create-table-cloth-mesh';
import { createTableRailDiamondsMesh } from '../../models/table/create-table-rail-diamonds-mesh';
import { createTableRailMesh } from '../../models/table/create-table-rail-mesh';
import { makeTheme } from '../../store/theme';
import type { Pocket } from './pocket.component';

export class TableMesh extends Renderable {
  constructor(public cloth: Mesh, public rail: Mesh, public diamonds: Mesh) {
    const parent = new Object3D();
    parent.add(cloth, rail, diamonds);
    super(parent);
  }

  public static create({ pockets }: { pockets: Pocket[] }) {
    warn(pockets.length === 0, 'No pockets used to create table mesh');

    const theme = makeTheme();
    const cloth = createTableClothMesh(defaultParams, pockets, theme);
    const rail = createTableRailMesh(defaultParams, pockets, theme);
    const diamonds = createTableRailDiamondsMesh(defaultParams, theme);

    return new TableMesh(cloth, rail, diamonds);
  }
}
