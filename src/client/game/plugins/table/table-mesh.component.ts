import { defaultParams } from '@common/simulation/physics';
import { warn } from '@common/util';
import { Object3D } from 'three';
import { Renderable } from '../../components/renderable';
import { createTableClothMesh } from '../../models/table/create-table-cloth-mesh';
import { createTableRailDiamondsMesh } from '../../models/table/create-table-rail-diamonds-mesh';
import { createTableRailMesh } from '../../models/table/create-table-rail-mesh';
import { makeTheme } from '../../store/theme';
import type { Pocket } from './pocket.component';

export class TableMesh extends Renderable {
  public static create({ pockets }: { pockets: Pocket[] }) {
    const parent = new Object3D();

    warn(pockets.length === 0, 'No pockets used to create table mesh');

    const theme = makeTheme();
    const cloth = createTableClothMesh(defaultParams, pockets, theme);
    const rail = createTableRailMesh(defaultParams, pockets, theme);
    const diamonds = createTableRailDiamondsMesh(defaultParams, theme);

    parent.add(cloth, rail, diamonds);
    return new TableMesh(parent);
  }
}
