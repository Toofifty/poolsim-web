import type { Socket } from 'socket.io-client';
import type { LobbyData } from '../../common/data';
import type {
  SerializedTableState,
  TableState,
} from '../../common/simulation/table-state';
import type { Cue, SerializedCue } from './objects/cue';

export interface INetwork {
  syncTableState(tableState: TableState): void;
  onSyncTableState(fn?: (tableState: SerializedTableState) => void): void;
  syncCue(cue: Cue): void;
  onSyncCue(fn?: (cue: SerializedCue) => void): void;
}

export class Network implements INetwork {
  constructor(private socket: Socket, private lobby: LobbyData) {}

  syncTableState(tableState: TableState): void {
    this.socket.emit('sync-table-state', [
      this.lobby.id,
      tableState.serialize(),
    ]);
  }

  onSyncTableState(fn?: (tableState: SerializedTableState) => void): void {
    this.socket.off('sync-table-state');
    if (fn) this.socket.on('sync-table-state', fn);
  }

  syncCue(cue: Cue): void {
    this.socket.emit('sync-cue', [this.lobby.id, cue.serialize()]);
  }

  onSyncCue(fn?: (cue: SerializedCue) => void): void {
    this.socket.off('sync-cue');
    if (fn) this.socket.on('sync-cue', fn);
  }
}

export class LocalNetwork implements INetwork {
  syncTableState(tableState: TableState): void {}
  onSyncTableState(fn: (tableState: SerializedTableState) => void): void {}
  syncCue(cue: Cue): void {}
  onSyncCue(fn: (cue: SerializedCue) => void): void {}
}
