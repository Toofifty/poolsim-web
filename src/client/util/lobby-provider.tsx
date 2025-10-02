import { notifications } from '@mantine/notifications';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { LobbyData, PlayerData } from '../../common/data';
import { socket } from '../socket';
import { LobbyContext } from './use-lobby';

export const LobbyProvider = ({ children }: { children: ReactNode }) => {
  const [id, setId] = useState<string>();
  const [lobby, setLobby] = useState<LobbyData>();
  const lastId = useRef<string>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('lobby-update', (lobbyData: LobbyData) => {
      setLobby(lobbyData);
      if (lobbyData.started) {
        navigate('/game');
      }
    });
    socket.on('lobby-player-join', (playerData: PlayerData) => {
      notifications.show({
        message: `${playerData.name} joined`,
      });
    });
    socket.on('lobby-player-leave', (playerData: PlayerData) => {
      notifications.show({
        message: `${playerData.name} left`,
      });
    });
    if (id !== lastId.current) {
      socket.emit('join-lobby', id);
      lastId.current = id;
    }

    return () => {
      socket.off('lobby-update');
      socket.off('lobby-player-join');
      socket.off('lobby-player-leave');
    };
  }, [id]);

  return (
    <LobbyContext.Provider value={{ lobby, setId }}>
      {children}
    </LobbyContext.Provider>
  );
};
