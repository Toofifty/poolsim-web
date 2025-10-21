import { createEventSystemFactory } from '@common/ecs/func';
import { vec } from '@common/math';
import { dlerp } from '../../dlerp';
import type { GameEvents } from '../../events';
import { findBallById } from './find-ball-by-id';
import { InHand } from './in-hand.component';

const LIFT = 0.1;

export const pickupBallSystem = createEventSystemFactory<GameEvents>()(
  'game/pickup-ball',
  async (ecs, { id }) => {
    const [entity, ball] = findBallById(ecs, id);

    ecs.addComponent(entity, InHand.create());
    await dlerp((v) => vec.msetZ(ball.r, v), ball.r[2], ball.R + LIFT, 100);
    const [inHand] = ecs.get(entity, InHand);
    inHand.animating = false;
  }
);
