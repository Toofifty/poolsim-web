import { ECS, StartupSystem } from '@common/ecs';
import { vec, type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Renderable } from '../../components/renderable';
import type { GameEvents } from '../../events';
import { CushionMesh } from './cushion-mesh.component';
import { Cushion } from './cushion.component';

export class CushionSetupSystem extends StartupSystem {
  public run(ecs: ECS<GameEvents>): void {
    const {
      cushion: { width },
      pocket: { edge, corner },
      table,
    } = defaultParams;

    const t = vec.new(0, table.width / 2);
    const b = vec.new(0, -table.width / 2);
    /** top-left */
    const tl = vec.new(-table.length / 2, table.width / 2);
    /** bottom-left */
    const bl = vec.new(-table.length / 2, -table.width / 2);
    /** bottom-right */
    const br = vec.new(table.length / 2, -table.width / 2);
    /** top-right */
    const tr = vec.new(table.length / 2, table.width / 2);

    const cushions: [Vec, Vec, Vec, Vec][] = [
      // left
      [
        vec.addY(bl, corner.radius),
        vec.addXY(bl, width, width + corner.radius + corner.girth),
        vec.subXY(tl, -width, width + corner.radius + corner.girth),
        vec.subY(tl, corner.radius),
      ],
      // top-left
      [
        vec.addX(tl, corner.radius),
        vec.addXY(tl, width + corner.radius + corner.girth, -width),
        vec.subXY(t, edge.radius + edge.girth, width),
        vec.subX(t, edge.radius),
      ],
      // top-right
      [
        vec.addX(t, edge.radius),
        vec.addXY(t, edge.radius + edge.girth, -width),
        vec.subXY(tr, width + corner.radius + corner.girth, width),
        vec.subX(tr, corner.radius),
      ],
      // right
      [
        vec.subY(tr, corner.radius),
        vec.subXY(tr, width, width + corner.radius + corner.girth),
        vec.addXY(br, -width, width + corner.radius + corner.girth),
        vec.addY(br, corner.radius),
      ],
      // bottom-right
      [
        vec.subX(br, corner.radius),
        vec.subXY(br, width + corner.radius + corner.girth, -width),
        vec.addXY(b, edge.radius + edge.girth, width),
        vec.addX(b, edge.radius),
      ],
      // bottom-left
      [
        vec.subX(b, edge.radius),
        vec.subXY(b, edge.radius + edge.girth, -width),
        vec.addXY(bl, width + corner.radius + corner.girth, width),
        vec.addX(bl, corner.radius),
      ],
    ];

    cushions.forEach((vertices) => {
      ecs.spawnImmediate(Cushion.create(vertices), [
        CushionMesh.create(vertices),
        Renderable,
      ]);
    });
  }
}
