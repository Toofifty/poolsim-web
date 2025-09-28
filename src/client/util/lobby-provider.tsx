import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LobbyData } from '../../common/data';
import { socket } from '../socket';
import { LobbyContext } from './use-lobby';

export const LobbyProvider = ({ children }: { children: ReactNode }) => {
  const [id, setId] = useState<string>();
  const [lobby, setLobby] = useState<LobbyData>();
  const lastId = useRef<string>(undefined);

  useEffect(() => {
    socket.on('lobby-update', setLobby);
    if (id !== lastId.current) {
      socket.emit('join-lobby', id);
      lastId.current = id;
    }

    return () => {
      socket.off('lobby-update');
    };
  }, [id]);

  return (
    <LobbyContext.Provider value={{ lobby, setId }}>
      {children}
    </LobbyContext.Provider>
  );
};
