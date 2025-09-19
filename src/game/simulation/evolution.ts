import type { PhysicsBall } from '../physics/ball';
import type { PhysicsCushion } from '../physics/cushion';
import type { PhysicsPocket } from '../physics/pocket';
import type { TableState } from './table-state';

export type PhysicsEvent =
  | {
      type: 'ball-ball';
      balls: [PhysicsBall, PhysicsBall];
    }
  | { type: 'ball-cushion'; ball: PhysicsBall; cushion: PhysicsCushion }
  | { type: 'ball-pocket'; ball: PhysicsBall; pocket: PhysicsPocket };

export const getTimeUntilEvent = (state: TableState) => {
  const activeBalls = state.activeBalls;

  let deltaTime = Infinity;
  let events: PhysicsEvent[] = [];

  for (let i = 0; i < activeBalls.length; i++) {
    const ball = activeBalls[i];

    for (let j = i + 1; j < activeBalls.length; j++) {
      const other = activeBalls[j];
      const timeToBallBall = ball.getTimeToBallCollision(other);
      if (timeToBallBall <= deltaTime) {
        const event = {
          type: 'ball-ball',
          balls: [ball, other],
        } satisfies PhysicsEvent;

        if (timeToBallBall === deltaTime) {
          events.push(event);
        } else {
          events = [event];
          deltaTime = timeToBallBall;
        }
      }
    }
  }

  return { deltaTime, events };
};
