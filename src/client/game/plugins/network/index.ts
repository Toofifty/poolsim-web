import type { LobbyData } from '@common/data';
import { createPlugin } from '@common/ecs/func';
import type { Socket } from 'socket.io-client';
import type { GameEvents } from '../../events';
import { networkClientPlugin } from './client.plugin';
import { networkCommonPlugin } from './common.plugin';
import { networkHostPlugin } from './host.plugin';

export const createNetworkPlugin = (socket: Socket, lobby: LobbyData) =>
  createPlugin<GameEvents>(
    (ecs) => {
      networkCommonPlugin.install(ecs);
      if (lobby.hostId === socket.id) {
        networkHostPlugin.install(ecs);
      } else {
        networkClientPlugin.install(ecs);
      }
    },
    (ecs) => {
      networkCommonPlugin.uninstall(ecs);
      if (lobby.hostId === socket.id) {
        networkHostPlugin.uninstall(ecs);
      } else {
        networkClientPlugin.uninstall(ecs);
      }
    }
  );
