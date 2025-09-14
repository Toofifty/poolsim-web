import type { PhysicsBall } from './ball';
import type { PhysicsCushion } from './cushion';
import type { PhysicsPocket } from './pocket';
import type { Vec } from './vec';

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
};
export type BallCushionCollision = {
  type: 'ball-cushion';
  initiator: PhysicsBall;
  other: PhysicsCushion;
  position: Vec;
  impulse: Vec;
};
export type BallPocketCollision = {
  type: 'ball-pocket';
  initiator: PhysicsBall;
  other: PhysicsPocket;
  position: Vec;
};
