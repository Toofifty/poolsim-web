import { ECS, StartupSystem } from '@common/ecs';
import { vec, type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import type { GameEvents } from '../../events';
import { PocketMesh } from './pocket-mesh.component';
import { Pocket } from './pocket.component';

export class PocketSetupSystem extends StartupSystem {
  public run(ecs: ECS<GameEvents>): void {
    const {
      table,
      pocket: { edge, corner },
      ball: { radius },
    } = defaultParams;

    const left = -table.length / 2;
    const right = table.length / 2;
    const top = -table.width / 2;
    const bottom = table.width / 2;

    const edgeOffset = corner.radius - edge.radius;

    const pockets: { position: Vec; radius: number }[] = [
      { position: vec.new(left, top, radius), radius: corner.radius },
      { position: vec.new(right, top, radius), radius: corner.radius },
      { position: vec.new(left, bottom, radius), radius: corner.radius },
      { position: vec.new(right, bottom, radius), radius: corner.radius },
      { position: vec.new(0, top - edgeOffset, radius), radius: edge.radius },
      {
        position: vec.new(0, bottom + edgeOffset, radius),
        radius: edge.radius,
      },
    ];

    pockets.forEach((pocket, id) => {
      ecs.spawnImmediate(
        Pocket.create({ id, ...pocket }),
        PocketMesh.create(pocket)
      );
    });
  }
}
