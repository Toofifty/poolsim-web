import type { Socket } from 'socket.io-client';
import { TypedEventTarget } from 'typescript-event-target';
import type { LobbyData } from '../../../common/data';
import type { SerializedPhysicsBall } from '../../../common/simulation/physics';
import type { RuleSet } from '../../../common/simulation/table-state';
import type { SerializedOnlineGameState } from '../controller/online-game-controller';
import type { BallProto } from '../objects/ball';
import type { SerializedCue } from '../objects/cue';
import type { NetworkAdapter, NetworkEventMap } from './network-adapter';

export class OnlineAdapter
  extends TypedEventTarget<NetworkEventMap>
  implements NetworkAdapter
{
  public isMultiplayer = true;

  constructor(private socket: Socket, private lobby: LobbyData) {
    super();

    const bind = (event: keyof NetworkEventMap) => {
      this.socket.on(event, (data) => {
        this.dispatchTypedEvent(
          event,
          new CustomEvent(event, { detail: data })
        );
      });
    };

    bind('setup-table');
    bind('reset-cue-ball');
    bind('set-game-state');
    bind('place-ball-in-hand');
    bind('update-ball-in-hand');
    bind('update-cue');
    bind('shoot');
  }

  get isHost() {
    return this.lobby.hostId === this.socket.id;
  }

  setupTable(data: { rack: BallProto[]; ruleSet: RuleSet }): void {
    this.socket.emit('setup-table', [this.lobby.id, data]);
  }

  resetCueBall(): void {
    this.socket.emit('reset-cue-ball', [this.lobby.id]);
  }

  setGameState(state: SerializedOnlineGameState): void {
    this.socket.emit('set-game-state', [this.lobby.id, state]);
  }

  placeBallInHand(ball: SerializedPhysicsBall): void {
    this.socket.emit('place-ball-in-hand', [this.lobby.id, ball]);
  }

  updateBallInHand(ball: SerializedPhysicsBall): void {
    this.socket.emit('update-ball-in-hand', [this.lobby.id, ball]);
  }

  updateCue(cue: SerializedCue): void {
    this.socket.emit('update-cue', [this.lobby.id, cue]);
  }

  shoot(cue: SerializedCue): void {
    this.socket.emit('shoot', [this.lobby.id, cue]);
  }
}
