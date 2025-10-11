import { ECS, EventSystem, Plugin } from '@common/ecs';
import { vec } from '@common/math';
import type { GameEvents } from '../events';
import type { Game } from '../game';
import { Audio } from '../resources/audio';
import { toVector3 } from '../util/three-interop';
import type { BallBallCollision } from './physics/collision/types';

export class AudioPlugin extends Plugin {
  public install(ecs: ECS<GameEvents, Game>): void {
    ecs.addResource(new Audio(ecs.game.scene));
    ecs.addEventSystem(new BallCollisionAudioSystem());
  }
}

class BallCollisionAudioSystem extends EventSystem<
  'game/ball-collision',
  GameEvents
> {
  public event = 'game/ball-collision' as const;

  private soundsPlayed = 0;
  private currentFrame = 0;

  public run(ecs: ECS<GameEvents, Game>, data: BallBallCollision): void {
    if (this.currentFrame !== ecs.frameId) {
      this.currentFrame = ecs.frameId;
      this.soundsPlayed = 0;
    }

    if (this.soundsPlayed >= 1) {
      return;
    }

    const audio = ecs.resource(Audio);
    audio.play(
      'clack_mid',
      toVector3(data.position),
      Math.min(vec.len(data.impulse) * 2, 5)
    );
    this.soundsPlayed++;
  }
}
