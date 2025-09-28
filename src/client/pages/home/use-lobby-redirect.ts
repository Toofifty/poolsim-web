import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LobbyData } from '../../../common/data';
import { socket } from '../../socket';

export const useLobbyRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    socket.once('lobby-update', (data: LobbyData) => {
      navigate(`/lobby/${data.id}`);
    });

    return () => {
      socket.off('lobby-update');
    };
  }, [navigate]);
};
