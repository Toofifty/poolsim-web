import { Mesh, MeshBasicMaterial, Object3D, PlaneGeometry } from 'three';
import {
  TypedEventTarget,
  type TypedEventListenerOrEventListenerObject,
} from 'typescript-event-target';
import { vec, type Vec } from '../../../common/math';
import type { Collision } from '../../../common/simulation/collision';
import {
  Ruleset,
  type Params,
  type SerializedPhysicsBall,
} from '../../../common/simulation/physics';
import { Result } from '../../../common/simulation/result';
import { Simulation } from '../../../common/simulation/simulation';
import {
  EightBallState,
  Player,
  TableState,
} from '../../../common/simulation/table-state';
import { createCushions } from '../factory/cushion';
import { createPockets } from '../factory/pocket';
import { Game } from '../game';
import { Ball, type BallProto } from '../objects/ball';
import { Cue } from '../objects/cue';
import { type Cushion } from '../objects/cushion';
import type { Pocket } from '../objects/pocket';
import { Table } from '../objects/table';
import { Rack, type Sandboxes } from '../rack';
import { AimAssist } from '../simulation/aim-assist';
import { settings } from '../store/settings';
import { subscribe, subscribeTo } from '../util/subscribe';
import { toVec, toVector3 } from '../util/three-interop';
import type { InputController } from './input-controller';

export enum PlayState {
  Initializing,
  PlayerShoot,
  OpponentShoot,
  AIShoot,
  PlayerInPlay,
  OpponentInPlay,
  AIInPlay,
  PlayerBallInHand,
  OpponentBallInHand,
}

export type GameControllerEventMap = {
  // for network
  ['setup-table']: CustomEvent<{ rack: BallProto[]; ruleset: Ruleset }>;
  ['reset-cue-ball']: Event;
  ['set-game-state']: Event;
  ['place-ball-in-hand']: CustomEvent<SerializedPhysicsBall>;
  ['update-ball-in-hand']: Event;
  ['update-cue']: Event;
  ['shoot']: Event;

  // for UI
  ['8-ball-state-change']: CustomEvent<{
    state: EightBallState;
    isPlayer1: boolean;
  }>;
  ['balls-potted']: CustomEvent<{
    ids: number[];
  }>;
};

export type GameEventListener<K extends keyof GameControllerEventMap> =
  TypedEventListenerOrEventListenerObject<GameControllerEventMap, K>;

export interface GameController
  extends TypedEventTarget<GameControllerEventMap> {
  readonly state: TableState;
  readonly playState: PlayState;

  readonly table: Table;
  readonly cue: Cue;
  readonly cushions: Cushion[];
  readonly pockets: Pocket[];
  readonly balls: Ball[];

  readonly root: Object3D;

  // setup
  setup8Ball(): void;
  setup9Ball(): void;
  setupSandboxGame(type?: Sandboxes): void;
  setupPrevious(): void;

  // gameplay
  shoot(): void;
  // todo: dedupe (this is just for mobile ui for now)
  uiShoot(): void;
  update(dt: number): void;
}

export abstract class BaseGameController
  extends TypedEventTarget<GameControllerEventMap>
  implements GameController
{
  public state: TableState;
  public playState!: PlayState;

  public table: Table;
  public cue: Cue;
  public cushions: Cushion[];
  public pockets: Pocket[];
  public balls: Ball[];

  public root: Object3D;

  private plane: Mesh;

  private simulation: Simulation;
  private simulationResult: Result;
  protected aimAssist: AimAssist;

  protected ballInHand?: Ball;

  constructor(protected params: Params, private input: InputController) {
    super();

    this.setPlayState(PlayState.Initializing);
    this.cue = new Cue(params);
    this.pockets = createPockets(params);
    this.cushions = createCushions(params);
    this.table = new Table(params, this.pockets);
    this.balls = [];
    this.state = new TableState(
      [],
      this.cushions.map((cushion) => cushion.physics),
      this.pockets.map((pocket) => pocket.physics),
      Ruleset._9Ball
    );
    this.simulation = new Simulation(params);
    this.simulationResult = new Result(undefined, this.state);
    this.aimAssist = new AimAssist(params);

    // todo: make cue, pockets Object3D
    this.root = new Object3D().add(this.table, this.cue);

    this.plane = new Mesh(
      new PlaneGeometry(params.table.length * 3, params.table.width * 3),
      new MeshBasicMaterial({ color: '#fff' })
    );
    this.plane.position.z = -params.ball.radius;
    this.plane.visible = false;
    this.root.add(this.plane);

    this.setupDragListener();
    this.input.onMouseDown((e) => {
      if (this.ballInHand && (e.button === 0 || e.button === 2)) {
        vec.msetZ(this.ballInHand.physics.position, 0);
        this.dispatchTypedEvent(
          'place-ball-in-hand',
          new CustomEvent('place-ball-in-hand', {
            detail: this.ballInHand.physics.serialize(),
          })
        );
        this.ballInHand = undefined;
        return;
      }

      if (e.button === 0 && this.getCueControlMode() === 'cursor') {
        this.shoot();
        this.dispatchTypedEvent('shoot', new Event('shoot'));
      }
    });

    subscribeTo(params, ['ball.radius'], () => this.setupPrevious());

    subscribe(params.pocket, () => {
      this.root.remove(...this.cushions, this.table);
      this.cushions.forEach((cushion) => cushion.dispose());
      this.pockets.forEach((pocket) => pocket.dispose());
      this.table.dispose();

      this.pockets = createPockets(params);
      this.cushions = createCushions(params);
      this.table = new Table(params, this.pockets);
      this.createFreshState();
      this.root.add(this.table);
    });
  }

  private setupDragListener() {
    let last: Vec | undefined = undefined;

    this.input.onTouchStart((event) => {
      last = this.getMouse3D(this.input.getRelativeTouch(event));
    });

    this.input.onTouchMove((event) => {
      if (!this.shouldUpdateCue()) return;

      const touch = this.getMouse3D(this.input.getRelativeTouch(event));
      if (!touch) return;

      if (last) {
        const lastToCue = vec.sub(this.cue.ballPosition, last);
        const touchToCue = vec.sub(this.cue.ballPosition, touch);
        const lastAngle = Math.atan2(lastToCue[1], lastToCue[0]);
        const touchAngle = Math.atan2(touchToCue[1], touchToCue[0]);
        this.cue.angle += touchAngle - lastAngle;
        this.dispatchTypedEvent('update-cue', new Event('update-cue'));
      }

      last = touch;
    });
  }

  private createFreshState() {
    this.state = new TableState(
      this.balls.map((ball) => ball.physics),
      this.cushions.map((cushion) => cushion.physics),
      this.pockets.map((pocket) => pocket.physics),
      this.state.ruleset
    );
  }

  private setBalls(balls: Ball[]): void {
    if (balls.length === 0) {
      throw new Error('Cannot set balls to empty');
    }

    this.balls.forEach((ball) => {
      this.root.remove(ball.parent);
      ball.dispose();
    });

    this.balls = balls;
    this.cue.attachTo(balls[0]);
    // todo: make balls Object3Ds
    this.root.add(...balls.map((ball) => ball.parent));
    this.state.balls = balls.map((ball) => ball.physics);
    this.state.needsUpdate = true;
    this.aimAssist.setBalls([...balls]);
  }

  /**
   * @emits setup-table
   */
  protected setupTable({
    rack,
    ruleset,
  }: {
    rack: BallProto[];
    ruleset: Ruleset;
  }): void {
    this.setBalls(rack.map((proto) => new Ball(this.params, proto)));
    this.state.reset();
    this.state.ruleset = ruleset;
    this.dispatchTypedEvent(
      'setup-table',
      new CustomEvent('setup-table', { detail: { rack, ruleset } })
    );
  }

  public setup8Ball(): void {
    this.setupTable({
      rack: Rack.generate8Ball(Rack.getTip(this.params)),
      ruleset: Ruleset._8Ball,
    });
  }

  public setup9Ball(): void {
    this.setupTable({
      rack: Rack.generate9Ball(Rack.getTip(this.params)),
      ruleset: Ruleset._9Ball,
    });
  }

  public setupSandboxGame(type: Sandboxes = 'debug'): void {
    this.setupTable({
      rack: Rack.generateSandboxGame(this.params, type),
      ruleset: Ruleset.SandboxSequential,
    });
  }

  public setupPrevious(): void {
    switch (this.state.ruleset) {
      case Ruleset._8Ball:
        this.setup8Ball();
        break;
      default:
        this.setup9Ball();
        break;
    }
  }

  public abstract startGame(): void;

  /**
   * @emits reset-cue-ball
   */
  protected resetCueBall(): void {
    this.balls[0].place(-this.params.table.length / 4, 0);
    this.state.needsUpdate = true;
    this.cue.attachTo(this.balls[0]);
    this.dispatchTypedEvent('reset-cue-ball', new Event('reset-cue-ball'));
  }

  public abstract shoot(): void;

  public uiShoot() {
    this.shoot();
    this.dispatchTypedEvent('shoot', new Event('shoot'));
  }

  /**
   * @emits set-game-state
   */
  protected setPlayState(state: PlayState, noEmit: boolean = false): void {
    this.simulationResult = new Result(undefined, this.state);
    const previous = this.playState;
    this.playState = state;
    if (!noEmit) {
      this.dispatchTypedEvent('set-game-state', new Event('set-game-state'));
    }

    if (
      this.playState === PlayState.PlayerShoot &&
      previous !== PlayState.PlayerInPlay &&
      previous !== PlayState.PlayerBallInHand
    ) {
      Game.audio.play('boop');
    }
  }

  protected get isInPlay(): boolean {
    return [
      PlayState.PlayerInPlay,
      PlayState.OpponentInPlay,
      PlayState.AIInPlay,
    ].includes(this.playState);
  }

  protected get isShooting(): boolean {
    return [
      PlayState.PlayerShoot,
      PlayState.OpponentShoot,
      PlayState.AIShoot,
    ].includes(this.playState);
  }

  /**
   * Called only when state is settled.
   */
  protected abstract updateState(): void;

  protected shouldPauseSimulation(): boolean {
    return false;
  }

  protected shouldShowAimAssist(): boolean {
    return false;
  }

  private playCollisionSounds(collisions: Collision[]) {
    let soundsPlayed = 0;
    collisions.forEach((collision) => {
      if (collision.type === 'ball-ball' && soundsPlayed < 1) {
        Game.audio.play(
          'clack_mid',
          toVector3(collision.position),
          Math.min(vec.len(collision.impulse) * 2, 5)
        );
        soundsPlayed++;
      }
      if (collision.type === 'ball-pocket') {
        Game.audio.play('pocket_drop', toVector3(collision.position));
      }
    });
  }

  protected hasBallInHand(): boolean {
    return !!this.ballInHand;
  }

  protected putBallInHand(ball?: Ball): void {
    this.ballInHand = ball ?? this.balls[0];
  }

  protected shouldUpdateBallInHand(): boolean {
    return this.hasBallInHand();
  }

  protected updateBallInHand(ball: Ball): void {
    if (!this.shouldUpdateBallInHand()) return;

    const mouse3D = this.getMouse3D();
    if (!mouse3D) return;
    const position = vec.setZ(mouse3D, 0);

    this.balls.forEach((other) => {
      const dist = vec.dist(position, vec.setZ(other.physics.r, 0));
      if (dist < ball.physics.radius + other.physics.radius) {
        const normal = vec.norm(vec.sub(ball.physics.r, other.physics.r));
        const overlap = ball.physics.radius + other.physics.radius - dist;
        const correction = vec.mult(normal, overlap * 2);
        vec.madd(position, correction);
      }
    });

    const collidingCushion = this.state.cushions.some((cushion) => {
      const closestPoint = cushion.findClosestPoint(position);
      return (
        vec.dist(vec.setZ(closestPoint, 0), position) < ball.physics.radius
      );
    });
    const collidingPocket = this.state.pockets.some(
      (pocket) =>
        vec.dist(vec.setZ(pocket.position, 0), position) < pocket.radius
    );
    const outOfBounds =
      position[0] < -this.params.table.length / 2 ||
      position[0] > this.params.table.length / 2 ||
      position[1] < -this.params.table.width / 2 ||
      position[1] > this.params.table.width / 2;

    const outOfBoundsOnBreak =
      this.state.isBreak && ball.number === 0
        ? position[0] > -this.params.table.length / 4
        : false;

    if (
      !collidingCushion &&
      !collidingPocket &&
      !outOfBounds &&
      !outOfBoundsOnBreak
    ) {
      vec.mcopy(ball.physics.position, position);
      vec.msetZ(ball.physics.position, 0.1);
      this.dispatchTypedEvent(
        'update-ball-in-hand',
        new Event('update-ball-in-hand')
      );
    }
  }

  protected getMouse3D(point?: Vec): Vec | undefined {
    const intersect = Game.getFirstMouseIntersection(this.plane, point);
    return intersect ? vec.setZ(toVec(intersect), 0) : undefined;
  }

  protected getCueControlMode(): 'touch' | 'cursor' {
    return settings.controlMode;
  }

  protected shouldUpdateCue(): boolean {
    return (
      this.playState === PlayState.PlayerShoot &&
      !settings.lockCue &&
      (this.getCueControlMode() === 'cursor' || !settings.enableZoomPan)
    );
  }

  protected updateCue(dt: number): void {
    if (this.shouldUpdateCue() && this.getCueControlMode() === 'cursor') {
      const mouse3D = this.getMouse3D();
      if (mouse3D) {
        this.cue.setTarget(mouse3D);
        this.dispatchTypedEvent('update-cue', new Event('update-cue'));
      }
    }
    this.cue.update(dt, this.state.settled);
  }

  protected shouldHighlightTargetBalls() {
    return (
      settings.highlightTargetBalls &&
      (this.playState === PlayState.PlayerShoot ||
        this.playState === PlayState.PlayerBallInHand)
    );
  }

  public update(dt: number): void {
    if (this.isInPlay && !this.shouldPauseSimulation()) {
      const result = this.simulation.step({
        trackPath: false,
        state: this.state,
        dt,
      });
      this.simulationResult.add(result);
      this.playCollisionSounds(result.collisions);
      if (result.ballsPotted.length > 0) {
        this.dispatchTypedEvent(
          'balls-potted',
          new CustomEvent('balls-potted', {
            detail: { ids: result.ballsPotted },
          })
        );
      }
    }

    if (this.isShooting && !this.cue.isShooting && this.shouldShowAimAssist()) {
      this.aimAssist.update(this.cue.getShot(), this.state).then(() => {
        this.balls.forEach((ball) => ball.updateProjection());
      });
    } else {
      this.aimAssist.clear();
      this.balls.forEach((ball) => ball.updateProjection());
    }

    const highlightedBalls = this.shouldHighlightTargetBalls()
      ? this.state.getTargetableBalls()
      : new Set();
    this.balls.forEach((ball) => {
      ball.sync();
      ball.highlight.visible = highlightedBalls.has(ball.id);
    });

    if (this.state.settled) {
      this.simulationResult.finalise();
      this.updateState();
    }

    if (this.ballInHand) {
      this.updateBallInHand(this.ballInHand);
    } else {
      this.updateCue(dt);
    }

    this.cue.visible =
      this.playState === PlayState.PlayerShoot ||
      this.playState === PlayState.AIShoot ||
      this.playState === PlayState.OpponentShoot || //
      this.playState === PlayState.PlayerInPlay ||
      this.playState === PlayState.AIInPlay ||
      this.playState === PlayState.OpponentInPlay;
  }

  // host-only
  protected update8BallState() {
    if (
      this.state.ruleset === Ruleset._8Ball &&
      !this.state.isBreak &&
      this.state.eightBallState === EightBallState.Open &&
      !this.simulationResult.hasFoul()
    ) {
      let pottedSolid = false;
      let pottedStripe = false;
      this.simulationResult.ballsPotted.forEach((id) => {
        if (id < 8) pottedSolid = true;
        if (id > 8) pottedStripe = true;
      });
      const isPlayer1 = this.state.currentPlayer === Player.One;
      if (pottedSolid && !pottedStripe) {
        this.state.eightBallState = isPlayer1
          ? EightBallState.Player1Solids
          : EightBallState.Player1Stripes;
        this.dispatchTypedEvent(
          '8-ball-state-change',
          new CustomEvent('8-ball-state-change', {
            detail: {
              state: this.state.eightBallState,
              isPlayer1: true,
            },
          })
        );
      } else if (!pottedSolid && pottedStripe) {
        this.state.eightBallState = isPlayer1
          ? EightBallState.Player1Stripes
          : EightBallState.Player1Solids;
        this.dispatchTypedEvent(
          '8-ball-state-change',
          new CustomEvent('8-ball-state-change', {
            detail: {
              state: this.state.eightBallState,
              isPlayer1: true,
            },
          })
        );
      }
    }
  }

  /**
   * Determine whether or not to switch turns.
   *
   * Will also assign stripes/solids for 8-ball if appropriate
   */
  protected shouldSwitchTurn(): boolean {
    return (
      this.simulationResult.hasFoul() ||
      this.simulationResult.ballsPotted.length === 0
    );
  }

  protected shouldPutBallInHand(): boolean {
    if (this.simulationResult.hasFoul()) {
      Game.audio.play('foul', undefined, 0.1);
      console.log('foul', this.simulationResult);
      return true;
    }
    return false;
  }
}
