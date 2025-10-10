import { Component } from '../../../../common/ecs';
import { quat, vec, type Quat, type Vec } from '../../../../common/math';

export enum PhysicsState {
  Stationary,
  Sliding,
  Rolling,
  Spinning,
  Airborne,
  Pocketed,
  OutOfPlay,
}

export type PhysicsSnapshot = {
  position: Vec;
  velocity: Vec;
  orientation: Quat;
  state: PhysicsState;
};

/**
 * Ball physics
 */
export class Physics extends Component {
  constructor(
    public id: number,
    /** position */
    public r: Vec,
    /** velocity */
    public v: Vec,
    /** angular velocity */
    public w: Vec,
    /** radius */
    public R: number,
    public orientation: Quat,
    public state: PhysicsState
  ) {
    super();
  }

  public snapshot(override: Partial<PhysicsSnapshot> = {}): PhysicsSnapshot {
    return {
      position: vec.clone(this.r),
      velocity: vec.clone(this.v),
      orientation: quat.clone(this.orientation),
      state: this.state,
      ...override,
    };
  }

  public static create(override: Partial<Physics> = {}) {
    return new Physics(
      override.id ?? 0,
      override.r ?? vec.new(0, 0, 0),
      override.v ?? vec.new(0, 0, 0),
      override.w ?? vec.new(0, 0, 0),
      override.R ?? 0,
      override.orientation ?? quat.random(),
      override.state ?? PhysicsState.Stationary
    );
  }
}
