import type { Params } from './simulation/physics';

export type LobbyData = {
  id: string;
  hostId: string;
  players: PlayerData[];
  started: boolean;
  params?: Params;
};

export type PlayerData = {
  id: string;
  name: string;
};
