import { ECS, StartupSystem } from '@common/ecs';
import { Pocket } from './pocket.component';
import { TableMesh } from './table-mesh.component';

export class TableSetupSystem extends StartupSystem {
  public run(ecs: ECS): void {
    const pocketEntities = ecs.query().has(Pocket).findAll();
    const pockets = pocketEntities
      .map((entity) => ecs.get(entity, Pocket))
      .flat();

    ecs.createAndSpawnImmediate(TableMesh.create({ pockets }));
  }
}
