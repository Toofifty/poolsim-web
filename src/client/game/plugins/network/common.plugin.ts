import type { ECS } from '@common/ecs';
import { createEventSystemFactory, createPlugin } from '@common/ecs/func';
import { vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { dlerp, dlerpAngle, dlerpVec } from '../../dlerp';
import type { GameEvents } from '../../events';
import { SystemState } from '../../resources/system-state';
import { throttle } from '../../util/throttle';
import { Cue } from '../cue/cue.component';
import { findBallById } from '../gameplay/find-ball-by-id';
import { InHand } from '../gameplay/in-hand.component';

const createEventSystem = createEventSystemFactory<GameEvents>();

const isActivePlayer = (ecs: ECS<GameEvents>) =>
  ecs.resource(SystemState).isActivePlayer;

const onPickupBall = createEventSystem('receive/pickup-ball', (ecs, data) => {
  if (isActivePlayer(ecs)) return;
  ecs.emit('game/pickup-ball', data);
});

const emitPickupBall = createEventSystem('game/pickup-ball', (ecs, data) => {
  if (!isActivePlayer(ecs)) return;
  ecs.emit('send/pickup-ball', data);
});

const onMoveBall = createEventSystem(
  'receive/move-ball',
  (ecs, { id, position }) => {
    if (isActivePlayer(ecs)) return;

    const [entity, ball] = findBallById(ecs, id);

    dlerpVec(
      (v) => {
        // throw away new values if the ball has been
        // placed already
        const [inHand] = ecs.get(entity, InHand);
        if (!inHand || inHand.animating) return;
        return vec.mcopy(ball.r, v);
      },
      ball.r,
      position,
      defaultParams.network.throttle
    );

    ecs.emit('game/move-ball', { id, position });
  }
);

const emitMoveBall = createEventSystem(
  'game/move-ball',
  (() => {
    let lastPosition = vec.new();

    return throttle((ecs, data) => {
      if (!isActivePlayer(ecs)) return;
      if (vec.eq(lastPosition, vec.setZ(data.position, 0))) return;

      lastPosition = vec.setZ(data.position, 0);
      ecs.emit('send/move-ball', data);
    }, defaultParams.network.throttle);
  })()
);

const onPlaceBall = createEventSystem('receive/place-ball', (ecs, data) => {
  if (isActivePlayer(ecs)) return;
  ecs.emit('game/place-ball', data);
});

const emitPlaceBall = createEventSystem('game/place-ball', (ecs, data) => {
  if (!isActivePlayer(ecs)) return;
  ecs.emit('send/place-ball', data);
});

const onMoveCue = createEventSystem('receive/move-cue', (ecs, data) => {
  if (isActivePlayer(ecs)) return;

  const cue = ecs.query().resolveFirst(Cue);
  cue.target = data.target;

  const t = defaultParams.network.throttle;

  dlerpAngle((v) => (cue.angle = v), cue.angle, data.angle, t);
  dlerp((v) => (cue.force = v), cue.force, data.force, t);
  dlerp((v) => (cue.top = v), cue.top, data.top, t);
  dlerp((v) => (cue.side = v), cue.side, data.side, t);
  dlerp((v) => (cue.lift = v), cue.lift, data.lift, t);

  // update UI
  ecs.emit('game/cue-update', cue);
});

const emitMoveCue = createEventSystem(
  'game/cue-update',
  (() => {
    let lastKey = 0n;

    return throttle((ecs, data) => {
      if (!isActivePlayer(ecs) || Cue.getKey(data) === lastKey) return;

      lastKey = Cue.getKey(data);
      ecs.emit('send/move-cue', data);
    }, defaultParams.network.throttle);
  })()
);

const onShoot = createEventSystem('receive/shoot', (ecs, data) => {
  if (isActivePlayer(ecs)) return;

  const cue = ecs.query().resolveFirst(Cue);
  cue.target = data.target;
  cue.angle = data.angle;
  cue.force = data.force;
  cue.top = data.top;
  cue.side = data.side;
  cue.lift = data.lift;

  ecs.emit('game/start-shooting', {});
});

const emitShoot = createEventSystem('game/start-shooting', (ecs, data) => {
  if (!isActivePlayer(ecs)) return;

  const cue = ecs.query().resolveFirst(Cue);
  ecs.emit('send/shoot', cue);
});

export const networkCommonPlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addEventSystem(onPickupBall);
  ecs.addEventSystem(onMoveBall);
  ecs.addEventSystem(onPlaceBall);
  ecs.addEventSystem(onMoveCue);
  ecs.addEventSystem(onShoot);

  ecs.addEventSystem(emitPickupBall);
  ecs.addEventSystem(emitMoveBall);
  ecs.addEventSystem(emitPlaceBall);
  ecs.addEventSystem(emitMoveCue);
  ecs.addEventSystem(emitShoot);

  return () => {
    ecs.removeEventSystem(onPickupBall);
    ecs.removeEventSystem(onMoveBall);
    ecs.removeEventSystem(onPlaceBall);
    ecs.removeEventSystem(onMoveCue);
    ecs.removeEventSystem(onShoot);

    ecs.removeEventSystem(emitPickupBall);
    ecs.removeEventSystem(emitMoveBall);
    ecs.removeEventSystem(emitPlaceBall);
    ecs.removeEventSystem(emitMoveCue);
    ecs.removeEventSystem(emitShoot);
  };
});
