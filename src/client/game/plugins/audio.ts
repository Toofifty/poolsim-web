import { ECS, EventSystem, Plugin } from '@common/ecs';
import { vec } from '@common/math';
import type { GameEvents } from '../events';
import type { Game } from '../game';
import { Audio } from '../resources/audio';
import { toVector3 } from '../util/three-interop';
import { Cue } from './cue/cue.component';
import type {
  BallBallCollision,
  BallPocketCollision,
} from './physics/collision/types';

export class AudioPlugin extends Plugin {
  public install(ecs: ECS<GameEvents, Game>): void {
    ecs.addResource(new Audio(ecs.game.scene));
    ecs.addEventSystem(new ShootAudioSystem());
    ecs.addEventSystem(new FoulAudioSystem());
    ecs.addEventSystem(new BallCollisionAudioSystem());
    ecs.addEventSystem(new PocketCollisionAudioSystem());
  }
}

class ShootAudioSystem extends EventSystem<'game/shoot', GameEvents> {
  public event = 'game/shoot' as const;
  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/shoot']
  ): void {
    const audio = ecs.resource(Audio);
    const cue = ecs.query().resolveFirst(Cue);
    audio.play('hit_centre', toVector3(cue.target), cue.force / 2);
  }
}

class FoulAudioSystem extends EventSystem<'game/foul', GameEvents> {
  public event = 'game/foul' as const;
  public run(
    ecs: ECS<GameEvents, unknown>,
    data: GameEvents['game/foul']
  ): void {
    const audio = ecs.resource(Audio);
    audio.play('foul', undefined, 0.1);
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

class PocketCollisionAudioSystem extends EventSystem<
  'game/pocket-collision',
  GameEvents
> {
  public event = 'game/pocket-collision' as const;

  public run(ecs: ECS<GameEvents, Game>, data: BallPocketCollision): void {
    const audio = ecs.resource(Audio);
    audio.play('pocket_drop', toVector3(data.position));
  }
}
