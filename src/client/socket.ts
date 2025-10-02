import { io } from 'socket.io-client';

export const socket = io(
  import.meta.env.PROD ? undefined : 'http://localhost:3005'
);
