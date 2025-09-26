export type LobbyData = {
  id: string;
  hostId: string;
  players: PlayerData[];
};

export type PlayerData = {
  id: string;
  name: string;
};
