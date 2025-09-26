import type { PhysicsBall, PhysicsBallSnapshot } from './ball';
import type { PhysicsCushion } from './cushion';
import type { Vec } from './math';
import type { PhysicsPocket } from './pocket';

export type Collision =
  | BallBallCollision
  | BallCushionCollision
  | BallPocketCollision;

export type BallBallCollision = {
  type: 'ball-ball';
  initiator: PhysicsBall;
  other: PhysicsBall;
  position: Vec;
  impulse: Vec;
  snapshots: {
    initiator: PhysicsBallSnapshot;
    other: PhysicsBallSnapshot;
  };
};
export type BallCushionCollision = {
  type: 'ball-cushion';
  initiator: PhysicsBall;
  other: PhysicsCushion;
  position: Vec;
  impulse: Vec;
  snapshots: {
    initiator: PhysicsBallSnapshot;
  };
};
export type BallPocketCollision = {
  type: 'ball-pocket';
  initiator: PhysicsBall;
  other: PhysicsPocket;
  position: Vec;
  snapshots: {
    initiator: PhysicsBallSnapshot;
  };
};
