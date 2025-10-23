import { createEventSystemFactory } from '@common/ecs/func';
import { vec } from '@common/math';
import { dlerp } from '../../dlerp';
import type { GameEvents } from '../../events';
import { findBallById } from './find-ball-by-id';
import { InHand } from './in-hand.component';

export const placeBallSystem = createEventSystemFactory<GameEvents>()(
  'game/place-ball',
  async (ecs, { id, position }) => {
    const [entity, ball] = findBallById(ecs, id);

    const [inHand] = ecs.get(entity, InHand);
    inHand.animating = true;
    vec.mcopy(ball.r, position);
    await dlerp((v) => vec.msetZ(ball.r, v), ball.r[2], ball.R, 100);
    ecs.removeComponent(entity, InHand);
  }
);
