import type { Socket } from 'socket.io-client';
import type { LobbyData } from '../../common/data';
import type {
  RuleSet,
  SerializedTableState,
} from '../../common/simulation/table-state';
import type { SerializedGameState } from './game-manager';
import type { BallProto } from './objects/ball';
import type { SerializedCue } from './objects/cue';
import { throttle } from './util/throttle';

export interface INetwork {
  isHost: boolean;
  isMultiplayer: boolean;
  setupTable(data: { rack: BallProto[]; ruleSet: RuleSet }): void;
  onSetupTable(
    fn?: (data: { rack: BallProto[]; ruleSet: RuleSet }) => void
  ): void;
  /** Only callable on host */
  syncGameState(gameState: SerializedGameState): void;
  /** Only called on non-host */
  onSyncGameState(fn?: (gameState: SerializedGameState) => void): void;
  /** Only callable on host */
  syncTableState(tableState: SerializedTableState): void;
  /** Only called on non-host */
  onSyncTableState(fn?: (tableState: SerializedTableState) => void): void;
  shootCue(cue: SerializedCue): void;
  onShootCue(fn?: (cue: SerializedCue) => void): void;
  syncCue(cue: SerializedCue): void;
  onSyncCue(fn?: (cue: SerializedCue) => void): void;
}

export class Network implements INetwork {
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

export class LocalNetwork implements INetwork {
  public isHost = true;
  public isMultiplayer = false;
  setupTable(data: { rack: BallProto[]; ruleSet: RuleSet }): void {}
  onSetupTable(
    fn?: (data: { rack: BallProto[]; ruleSet: RuleSet }) => void
  ): void {}
  syncGameState(gameState: SerializedGameState): void {}
  onSyncGameState(fn?: (gameState: SerializedGameState) => void): void {}
  syncTableState(tableState: SerializedTableState): void {}
  onSyncTableState(fn: (tableState: SerializedTableState) => void): void {}
  shootCue(cue: SerializedCue): void {}
  onShootCue(fn?: (cue: SerializedCue) => void): void {}
  syncCue(cue: SerializedCue): void {}
  onSyncCue(fn: (cue: SerializedCue) => void): void {}
}
