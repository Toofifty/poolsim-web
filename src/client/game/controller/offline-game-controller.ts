import { subscribe } from 'valtio';
import { vec } from '../../../common/math';
import { AimAssistMode, type Params } from '../../../common/simulation/physics';
import { AI } from '../ai';
import type { Ball } from '../objects/ball';
import { gameStore } from '../store/game';
import { Players, settings } from '../store/settings';
import { delay } from '../util/delay';
import { BaseGameController, PlayState } from './game-controller';
import type { InputController } from './input-controller';

export class OfflineGameController extends BaseGameController {
  private ai: AI;
  private aiProcessing = false;

  constructor(params: Params, input: InputController) {
    super(params, input);
    this.ai = new AI(params);

    // immediately make AI shoot if setting changes to AIvAI
    subscribe(settings, ([[op, [path], value]]) => {
      if (op === 'set' && path === 'players' && value === Players.AIVsAI) {
        if (this.playState === PlayState.PlayerShoot) {
          this.setPlayState(PlayState.AIShoot);
        }
      }
      if (op === 'set' && path === 'aimAssistMode') {
        this.aimAssist.mode = value as AimAssistMode;
      }
    });

    input.onMouseDown((e) => {
      if (e.button === 2 && !this.hasBallInHand() && this.state.settled) {
        const mouse3D = this.getMouse3D();
        if (!mouse3D) return;

        if (settings.enableBallPickup) {
          let closest: Ball | undefined;
          let closestDist = Infinity;

          for (const ball of this.balls) {
            const dist = vec.dist(mouse3D, ball.physics.position);
            if (dist < ball.radius && dist < closestDist) {
              closest = ball;
              closestDist = dist;
            }
          }
          if (closest?.isStationary) {
            this.putBallInHand(closest);
          }
          return;
        }

        if (this.state.isBreak && this.playState === PlayState.PlayerShoot) {
          if (
            vec.dist(mouse3D, this.balls[0].physics.position) <
            this.balls[0].radius
          ) {
            this.putBallInHand(this.balls[0]);
          }
        }
      }
    });

    this.setup9Ball();
    this.startGame();
  }

  public startGame(): void {
    this.state.isBreak = true;
    switch (settings.players) {
      case Players.AIVsAI:
        this.setPlayState(PlayState.AIShoot);
        return;
      case Players.PlayerVsPlayer:
        this.setPlayState(PlayState.PlayerShoot);
        return;
      default:
        this.setPlayState(
          Math.random() > 0.5 ? PlayState.PlayerShoot : PlayState.AIShoot
        );
        return;
    }
  }

  public shoot(): void {
    if (this.playState !== PlayState.PlayerShoot) return;

    this.cue.shoot(() => {
      this.setPlayState(PlayState.PlayerInPlay);
    });
  }

  protected override setPlayState(state: PlayState): void {
    super.setPlayState(state);
    gameStore.state = state;
  }

  private async playAIShot() {
    if (this.aiProcessing) return;
    this.aiProcessing = true;
    const shot = await this.ai.findShot(this.state, this.cue.topSpin);
    if (!shot) return;
    this.cue.setShot(shot);
    await delay(1000);
    this.cue.shoot(async () => {
      this.setPlayState(PlayState.AIInPlay);
      await delay(500);
      this.aiProcessing = false;
    });
  }

  protected updateState(): void {
    if (
      this.state.cueBall.isPocketedStationary ||
      this.state.cueBall.isOutOfBounds
    ) {
      this.resetCueBall();
    }

    if (this.state.isGameOver) {
      this.setupPrevious();
      this.startGame();
      return;
    }

    if (settings.players === Players.PlayerVsPlayer) {
      switch (this.playState) {
        case PlayState.PlayerInPlay:
        case PlayState.AIInPlay:
          this.state.isBreak = false;
          this.setPlayState(PlayState.PlayerShoot);
          return;
      }
    } else if (settings.players === Players.AIVsAI) {
      switch (this.playState) {
        case PlayState.PlayerInPlay:
        case PlayState.AIInPlay:
          this.state.isBreak = false;
          this.setPlayState(PlayState.AIShoot);
          return;
      }
    } else {
      switch (this.playState) {
        case PlayState.PlayerInPlay:
          this.state.isBreak = false;
          this.setPlayState(
            this.shouldSwitchTurn() ? PlayState.AIShoot : PlayState.PlayerShoot
          );
          return;
        case PlayState.AIInPlay:
          this.state.isBreak = false;
          this.setPlayState(
            this.shouldSwitchTurn() ? PlayState.PlayerShoot : PlayState.AIShoot
          );
          return;
      }
    }

    if (this.playState === PlayState.AIShoot) {
      this.playAIShot();
    }
  }

  protected shouldPauseSimulation(): boolean {
    return settings.pauseSimulation;
  }

  protected shouldUpdateCue(): boolean {
    return super.shouldUpdateCue() && !settings.lockCue;
  }

  protected shouldShowAimAssist(): boolean {
    return settings.aimAssistMode !== AimAssistMode.Off;
  }

  protected shouldHighlightTargetBalls(): boolean {
    return settings.highlightTargetBalls;
  }
}
