import type { Params } from './simulation/physics';

export type LobbyData = {
  id: string;
  hostId: string;
  players: PlayerData[];
  params?: Params;
};

export type PlayerData = {
  id: string;
  name: string;
};
