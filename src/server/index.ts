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
        Object.values(lobbies)
          .filter((lobby) => !lobby.isGameStarted())
          .map((lobby) => lobby.getData())
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

  socket.on('start-game', (id) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      if (!lobby.isHost(socket.id)) {
        throw new Error('Only the lobby host can start the game');
      }
      lobby.start();
      io.to(id).emit('game-starting');
    });
  });

  socket.on('setup-table', ([id, data]) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      io.to(id).emit('setup-table', data);
    });
  });

  socket.on('sync-cue', ([id, cue]) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      io.to(id).emit('sync-cue', cue);
    });
  });

  socket.on('shoot-cue', ([id, cue]) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      io.to(id).emit('shoot-cue', cue);
    });
  });

  socket.on('sync-game-state', ([id, gameState]) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      io.to(id).emit('sync-game-state', gameState);
    });
  });

  socket.on('sync-single-ball', ([id, ballState]) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      io.to(id).emit('sync-single-ball', ballState);
    });
  });

  socket.on('place-ball-in-hand', ([id]) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      io.to(id).emit('place-ball-in-hand');
    });
  });

  socket.on('sync-table-state', ([id, tableState]) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      io.to(id).emit('sync-table-state', tableState);
    });
  });

  socket.on('disconnect', () => {
    Object.entries(lobbies).forEach(([lobbyId, lobby]) => {
      if (lobby.hasPlayer(socket.id)) {
        if (lobby.leave(socket.id)) {
          console.log('destroy lobby', lobbyId);
          delete lobbies[lobbyId];
        } else {
          io.to(lobbyId).emit('lobby-update', lobby.getData());
        }
      }
    });
  });
});

server.listen(3004, () => {
  console.log('listening on :3004');
});
