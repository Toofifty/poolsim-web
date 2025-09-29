import type { LobbyData, PlayerData } from '../common/data';

const MAX_PLAYERS = 2;

export class Lobby {
  private players: PlayerData[] = [];
  private active = false;

  constructor(private id: string, private hostId: string) {}

  public hasPlayer(playerId: string) {
    return this.players.find(({ id }) => id === playerId);
  }

  public join(playerId: string, playerData?: Omit<PlayerData, 'id'>) {
    if (this.players.length >= MAX_PLAYERS) {
      throw new Error('Lobby is full!');
    }

    const index = this.players.findIndex(({ id }) => id === playerId);
    if (index >= 0) {
      this.players[index] = {
        ...this.players[index],
        id: playerId,
        ...playerData,
      };
      return;
    }

    this.players.push({
      id: playerId,
      ...(playerData ?? { name: `Player ${this.players.length + 1}` }),
    });
  }

  public leave(playerId: string) {
    this.players = this.players.filter(({ id }) => id !== playerId);
    if (this.players.length === 0) {
      return true;
    }
    if (playerId === this.hostId) {
      this.hostId = this.players[0].id;
    }
    return false;
  }

  public acceptingPlayers() {
    return !this.isGameStarted() && this.players.length < 2;
  }

  public isGameStarted() {
    return this.active;
  }

  public isHost(playerId: string) {
    return playerId === this.hostId;
  }

  public start() {
    // todo: server-side game controller
    this.active = true;
  }

  public getData(): LobbyData {
    return {
      id: this.id,
      hostId: this.hostId,
      players: this.players,
    };
  }
}
