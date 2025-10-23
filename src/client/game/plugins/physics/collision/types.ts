import type { Vec } from '@common/math';
import type { Pocket } from '../../table/pocket.component';
import type { Collider } from '../collider.component';
import type { Physics, PhysicsSnapshot } from '../physics.component';

export type Collision =
  | BallBallCollision
  | BallColliderCollision
  | BallPocketCollision;

export type BallBallCollision = {
  type: 'ball-ball';
  step?: number;
  initiator: Physics;
  other: Physics;
  position: Vec;
  impulse: Vec;
  snapshots: {
    initiator: PhysicsSnapshot;
    other: PhysicsSnapshot;
  };
};
export type BallColliderCollision = {
  type: 'ball-collider';
  step?: number;
  initiator: Physics;
  other: Collider;
  position: Vec;
  impulse: Vec;
  snapshots: {
    initiator: PhysicsSnapshot;
  };
};
export type BallPocketCollision = {
  type: 'ball-pocket';
  step?: number;
  initiator: Physics;
  other: Pocket;
  position: Vec;
  snapshots: {
    initiator: PhysicsSnapshot;
  };
};
