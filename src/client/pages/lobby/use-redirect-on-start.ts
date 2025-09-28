import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../socket';

export const useRedirectOnStart = () => {
  const navigate = useNavigate();
  useEffect(() => {
    socket.on('game-starting', () => {
      navigate('/game');
    });

    return () => {
      socket.off('game-starting');
    };
  }, [navigate]);
};
