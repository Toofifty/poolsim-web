import type { Vec } from '@common/math';
import type { Cushion } from '../../table/cushion.component';
import type { Pocket } from '../../table/pocket.component';
import type { Physics, PhysicsSnapshot } from '../physics.component';

export type Collision =
  | BallBallCollision
  | BallCushionCollision
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
export type BallCushionCollision = {
  type: 'ball-cushion';
  step?: number;
  initiator: Physics;
  other: Cushion;
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
