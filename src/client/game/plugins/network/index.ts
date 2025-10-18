import type { LobbyData } from '@common/data';
import type { ECS } from '@common/ecs';
import { createEventSystemFactory, createPlugin } from '@common/ecs/func';
import type { Socket } from 'socket.io-client';
import type { GameEvents } from '../../events';
import { networkClientPlugin } from './client.plugin';
import { networkCommonPlugin } from './common.plugin';
import { networkHostPlugin } from './host.plugin';

const listenerEvents: (keyof GameEvents)[] = [
  'receive/setup-table',
  'receive/system-state',
  'receive/pickup-ball',
  'receive/move-ball',
  'receive/place-ball',
  'receive/move-cue',
  'receive/shoot',
  'receive/params',
];

const broadcastEvents: (keyof GameEvents)[] = [
  'send/setup-table',
  'send/system-state',
  'send/pickup-ball',
  'send/move-ball',
  'send/place-ball',
  'send/move-cue',
  'send/shoot',
  'send/params',
];

const createNetworkListeners = (ecs: ECS<GameEvents>, socket: Socket) =>
  listenerEvents.forEach((event) =>
    socket.on(event, (data) => ecs.emit(event, data))
  );

const disposeNetworkListeners = (ecs: ECS<GameEvents>, socket: Socket) =>
  listenerEvents.forEach((event) => socket.off(event));

const createNetworkBroadcastSystems = (socket: Socket, lobby: LobbyData) => {
  const createEventSystem = createEventSystemFactory<GameEvents>();

  // todo: filter events based on host/client
  return broadcastEvents.map((event) =>
    createEventSystem(event, (ecs, data) =>
      socket.emit(event, [lobby.id, data])
    )
  );
};

export const createNetworkPlugin = (socket: Socket, lobby: LobbyData) =>
  createPlugin<GameEvents>((ecs) => {
    createNetworkListeners(ecs, socket);
    const broadcastSystems = createNetworkBroadcastSystems(socket, lobby).map(
      (system) => ecs.addEventSystem(system)
    );

    const uninstallCommon = networkCommonPlugin.install(ecs);

    if (lobby.hostId === socket.id) {
      const uninstallHost = networkHostPlugin.install(ecs);

      return () => {
        disposeNetworkListeners(ecs, socket);
        broadcastSystems.forEach((system) => ecs.removeEventSystem(system));
        uninstallCommon();
        uninstallHost();
      };
    } else {
      const uninstallClient = networkClientPlugin.install(ecs);

      return () => {
        disposeNetworkListeners(ecs, socket);
        broadcastSystems.forEach((system) => ecs.removeEventSystem(system));
        uninstallCommon();
        uninstallClient();
      };
    }
  });
