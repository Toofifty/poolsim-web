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
    } = defaultParams;

    const left = -table.length / 2;
    const right = table.length / 2;
    const top = -table.width / 2;
    const bottom = table.width / 2;

    const edgeOffset = corner.radius - edge.radius;

    const pockets: { id: number; position: Vec; radius: number }[] = [
      { id: 0, position: vec.new(left, top), radius: corner.radius },
      { id: 1, position: vec.new(right, top), radius: corner.radius },
      { id: 2, position: vec.new(left, bottom), radius: corner.radius },
      { id: 3, position: vec.new(right, bottom), radius: corner.radius },
      { id: 4, position: vec.new(0, top - edgeOffset), radius: edge.radius },
      { id: 5, position: vec.new(0, bottom + edgeOffset), radius: edge.radius },
    ];

    pockets.forEach((pocket) => {
      ecs.spawnImmediate(Pocket.create(pocket), PocketMesh.create(pocket));
    });
  }
}
