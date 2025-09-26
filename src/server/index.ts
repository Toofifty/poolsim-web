import cors from 'cors';
import express from 'express';
import http from 'http';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { Server } from 'socket.io';
import { Lobby } from './lobby';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

const lobbies: Record<string, Lobby> = {};

app.use(express.static(path.resolve(process.cwd())));
app.use(cors());

app.get('/', (_, res) => {
  res.sendFile(path.resolve(process.cwd(), 'index.html'));
});

io.on('connection', (socket) => {
  console.log(socket.id, 'connected');

  const withErrorHandling = (fn: () => void) => {
    try {
      fn();
    } catch (e: unknown) {
      if (e instanceof Error) {
        socket.emit('error', e.message);
        console.error(e.message);
      } else throw e;
    }
  };

  socket.on('query-lobbies', () => {
    withErrorHandling(() => {
      io.emit(
        'query-lobbies-response',
        Object.entries(lobbies)
          .filter(([, lobby]) => !lobby.isGameStarted())
          .map(([key]) => key)
      );
    });
  });

  socket.on('host', () => {
    withErrorHandling(() => {
      const id = nanoid();
      lobbies[id] = new Lobby(id, socket.id);
      io.emit('lobby-update', lobbies[id].getData());
      socket.join(id);
      console.log('lobby created:', id);
    });
  });

  socket.on('join-lobby', (id) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      lobby.join(socket.id);
      io.emit('lobby-update', lobby.getData());
      socket.join(id);
    });
  });
});
