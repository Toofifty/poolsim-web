import type { LobbyData } from '@common/data';
import { createPlugin } from '@common/ecs/func';
import type { Socket } from 'socket.io-client';
import type { GameEvents } from '../../events';
import { networkClientPlugin } from './client.plugin';
import { networkCommonPlugin } from './common.plugin';
import { networkHostPlugin } from './host.plugin';

export const createNetworkPlugin = (socket: Socket, lobby: LobbyData) =>
  createPlugin<GameEvents>((ecs) => {
    const uninstallCommon = networkCommonPlugin.install(ecs);
    if (lobby.hostId === socket.id) {
      const uninstallHost = networkHostPlugin.install(ecs);

      return () => {
        uninstallCommon();
        uninstallHost();
      };
    } else {
      const uninstallClient = networkClientPlugin.install(ecs);

      return () => {
        uninstallCommon();
        uninstallClient();
      };
    }
  });
