import { useEffect, useState } from 'react';
import type { LobbyData } from '../../../common/data';
import { socket } from '../../socket';

export const useLobbies = () => {
  const [lobbies, setLobbies] = useState<LobbyData[]>();

  useEffect(() => {
    socket.on('push-lobbies', setLobbies);
    socket.emit('query-lobbies', setLobbies);

    return () => {
      socket.off('push-lobbies');
    };
  }, []);

  return lobbies;
};
