import { io } from 'socket.io-client';

const PORT = 3004;
const l = window.location;
export const socket = io(`${l.protocol}//${l.hostname}:${PORT}`);
