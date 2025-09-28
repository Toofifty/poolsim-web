import { useEffect, useState } from 'react';
import type { LobbyData } from '../../../common/data';
import { socket } from '../../socket';

export const useLobbies = () => {
  const [lobbies, setLobbies] = useState<LobbyData[]>();

  useEffect(() => {
    socket.once('query-lobbies-response', setLobbies);
    socket.emit('query-lobbies');

    return () => {
      socket.off('query-lobbies-response');
    };
  }, []);

  return lobbies;
};
