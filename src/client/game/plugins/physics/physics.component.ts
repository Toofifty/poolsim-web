import { ECSComponent } from '@common/ecs';
import { quat, vec, type Quat, type Vec } from '@common/math';

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
export class Physics extends ECSComponent {
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
    public state: PhysicsState,
    public pocketId?: number
  ) {
    super();
  }

  public static create(override: Partial<Physics> = {}) {
    return new Physics(
      override.id ?? 0,
      override.r ?? vec.new(0, 0, 0),
      override.v ?? vec.new(0, 0, 0),
      override.w ?? vec.new(0, 0, 0),
      override.R ?? 0,
      override.orientation ?? quat.random(),
      override.state ?? PhysicsState.Stationary,
      override.pocketId
    );
  }

  public static snapshot(
    ball: Physics,
    override: Partial<PhysicsSnapshot> = {}
  ): PhysicsSnapshot {
    return {
      position: vec.clone(ball.r),
      velocity: vec.clone(ball.v),
      orientation: quat.clone(ball.orientation),
      state: ball.state,
      ...override,
    };
  }
}
