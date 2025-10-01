import { Mesh, Object3D } from 'three';
import type { Params } from '../../../common/simulation/physics';
import { Game } from '../game';
import { createTableClothMesh } from '../models/table/create-table-cloth-mesh';
import { createTableRailDiamondsMesh } from '../models/table/create-table-rail-diamonds-mesh';
import { createTableRailMesh } from '../models/table/create-table-rail-mesh';
import { themed } from '../store/theme';
import { Pocket } from './pocket';

export class Table extends Object3D {
  private cloth!: Mesh;
  private rail!: Mesh;
  private diamonds!: Mesh;

  private unsubscribeTheme: () => void;

  constructor(private params: Params, private pockets: Pocket[]) {
    super();

    this.unsubscribeTheme = themed((theme) => {
      if (this.cloth) {
        Game.dispose(this.cloth);
        this.remove(this.cloth);
      }

      this.cloth = createTableClothMesh(params, this.pockets, theme);
      this.add(this.cloth);

      if (this.rail) {
        Game.dispose(this.rail);
        this.remove(this.rail);
      }

      this.rail = createTableRailMesh(this.pockets, theme);
      this.add(this.rail);

      if (this.diamonds) {
        Game.dispose(this.diamonds);
        this.remove(this.diamonds);
      }

      this.diamonds = createTableRailDiamondsMesh(params, theme);
      this.add(this.diamonds);
    });
  }

  public dispose() {
    this.unsubscribeTheme();
    Game.dispose(this);
  }
}
