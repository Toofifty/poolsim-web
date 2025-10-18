import { ECSComponent } from '@common/ecs';
import { vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Shot } from '@common/simulation/shot';

export class Cue extends ECSComponent {
  constructor(
    /** position of target ball */
    public target = vec.new(0, 0, 0),
    public targetId: number = 0,
    public angle = 0,
    public force = defaultParams.cue.defaultForce,
    public top = 0,
    public side = 0,
    public lift = 0,
    public locked = false,
    public drawback = 0,
    public shooting = false
  ) {
    super();
  }

  public static create() {
    return new Cue();
  }

  public static getKey(cue: Cue) {
    return Shot.getKey(Shot.from(cue));
  }
}
