import { ECSComponent } from '@common/ecs';
import { vec, type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';

export class Pocket extends ECSComponent {
  constructor(
    public id: number,
    public position: Vec,
    public radius: number,
    public depth: number
  ) {
    super();
  }

  public static create({
    id,
    position,
    radius,
  }: {
    id: number;
    position: Vec;
    radius: number;
  }) {
    return new Pocket(
      id,
      vec.subZ(position, defaultParams.pocket.depth / 2),
      radius,
      defaultParams.pocket.depth
    );
  }
}
