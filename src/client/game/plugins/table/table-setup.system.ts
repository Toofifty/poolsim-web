import { ECS, StartupSystem } from '@common/ecs';
import type { GameEvents } from '../../events';
import { Pocket } from './pocket.component';
import { TableMesh } from './table-mesh.component';

export class TableSetupSystem extends StartupSystem {
  public run(ecs: ECS<GameEvents>): void {
    const pocketEntities = ecs.query().has(Pocket).findAll();
    const pockets = pocketEntities
      .map((entity) => ecs.get(entity, Pocket))
      .flat();

    ecs.spawnImmediate(TableMesh.create({ pockets }));
  }
}
