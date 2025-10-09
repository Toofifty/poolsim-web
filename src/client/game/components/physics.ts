import { Component } from '../../../common/ecs';
import { vec, type Vec } from '../../../common/math';

export enum PhysicsState {
  Stationary,
  Sliding,
  Rolling,
  Spinning,
  Airborne,
  Pocketed,
  OutOfPlay,
}

export class Physics extends Component {
  constructor(
    /** position */
    public r: Vec,
    /** velocity */
    public v: Vec,
    /** angular velocity */
    public w: Vec,
    /** radius */
    public R: number,
    public state: PhysicsState
  ) {
    super();
  }

  public static create(override: Partial<Physics> = {}) {
    return new Physics(
      override.r ?? vec.new(0, 0, 0),
      override.v ?? vec.new(0, 0, 0),
      override.w ?? vec.new(0, 0, 0),
      override.R ?? 0,
      override.state ?? PhysicsState.Stationary
    );
  }
}
