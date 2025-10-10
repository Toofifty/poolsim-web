import { Component, type Entity } from '@common/ecs';
import { vec, type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';

export class Cue extends Component {
  constructor(
    /** position of target ball */
    public target: Vec,
    public targetEntity: Entity | undefined,
    public angle: number,
    public force: number,
    public top: number,
    public side: number,
    public lift: number
  ) {
    super();
  }

  public static create() {
    return new Cue(
      vec.new(0, 0, 0),
      undefined,
      0,
      defaultParams.cue.defaultForce,
      0,
      0,
      0
    );
  }
}
