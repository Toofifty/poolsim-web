import type { Vector3 } from 'three';
import type { PhysicsBall } from './ball';
import type { PhysicsCushion } from './cushion';
import type { PhysicsPocket } from './pocket';

export type Collision =
  | BallBallCollision
  | BallCushionCollision
  | BallPocketCollision;

export type BallBallCollision = {
  type: 'ball-ball';
  initiator: PhysicsBall;
  other: PhysicsBall;
  position: Vector3;
  impulse: Vector3;
};
export type BallCushionCollision = {
  type: 'ball-cushion';
  initiator: PhysicsBall;
  other: PhysicsCushion;
  position: Vector3;
  impulse: Vector3;
};
export type BallPocketCollision = {
  type: 'ball-pocket';
  initiator: PhysicsBall;
  other: PhysicsPocket;
  position: Vector3;
};
