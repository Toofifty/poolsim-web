import type { Socket } from 'socket.io-client';
import type { LobbyData } from '../../../common/data';
import type { SerializedPhysicsBall } from '../../../common/simulation/physics';
import type {
  RuleSet,
  SerializedTableState,
} from '../../../common/simulation/table-state';
import type { SerializedGameState } from '../game-manager';
import type { BallProto } from '../objects/ball';
import type { SerializedCue } from '../objects/cue';
import { throttle } from '../util/throttle';
import type { NetworkAdapter } from './network-adapter';

export class MultiplayerAdapter implements NetworkAdapter {
  public isHost = false;
  public isMultiplayer = true;

  constructor(private socket: Socket, private lobby: LobbyData) {
    this.isHost = lobby.hostId === socket.id;
  }

  setupTable(data: { rack: BallProto[]; ruleSet: RuleSet }): void {
    if (!this.isHost) return;
    this.socket.emit('setup-table', [this.lobby.id, data]);
  }

  onSetupTable(
    fn?: (data: { rack: BallProto[]; ruleSet: RuleSet }) => void
  ): void {
    if (this.isHost) return;
    this.socket.off('setup-table');
    if (fn) this.socket.on('setup-table', fn);
  }

  syncGameState(gameState: SerializedGameState): void {
    if (!this.isHost) return;
    this.socket.emit('sync-game-state', [this.lobby.id, gameState]);
  }

  onSyncGameState(fn?: (gameState: SerializedGameState) => void): void {
    if (this.isHost) return;
    this.socket.off('sync-game-state');
    if (fn) this.socket.on('sync-game-state', fn);
  }

  syncTableState(tableState: SerializedTableState): void {
    if (!this.isHost) return;
    this.socket.emit('sync-table-state', [this.lobby.id, tableState]);
  }

  onSyncTableState = (
    fn?: (tableState: SerializedTableState) => void
  ): void => {
    if (this.isHost) return;
    this.socket.off('sync-table-state');
    if (fn) this.socket.on('sync-table-state', fn);
  };

  syncSingleBall = throttle((ballState: SerializedPhysicsBall): void => {
    this.socket.emit('sync-single-ball', [this.lobby.id, ballState]);
  }, 50);

  onSyncSingleBall(fn?: (ballState: SerializedPhysicsBall) => void): void {
    this.socket.off('sync-single-ball');
    if (fn) this.socket.on('sync-single-ball', fn);
  }

  placeBallInHand(): void {
    if (this.isHost) return;
    this.socket.emit('place-ball-in-hand', [this.lobby.id]);
  }

  onPlaceBallInHand(fn?: () => void): void {
    if (!this.isHost) return;
    this.socket.off('place-ball-in-hand');
    if (fn) this.socket.on('place-ball-in-hand', fn);
  }

  shootCue(cue: SerializedCue): void {
    this.socket.emit('shoot-cue', [this.lobby.id, cue]);
  }

  onShootCue(fn?: (cue: SerializedCue) => void): void {
    this.socket.off('shoot-cue');
    if (fn) this.socket.on('shoot-cue', fn);
  }

  syncCue = throttle((cue: SerializedCue): void => {
    this.socket.emit('sync-cue', [this.lobby.id, cue]);
  }, 50);

  onSyncCue(fn?: (cue: SerializedCue) => void): void {
    this.socket.off('sync-cue');
    if (fn) this.socket.on('sync-cue', fn);
  }
}
