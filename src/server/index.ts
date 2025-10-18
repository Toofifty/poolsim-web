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

app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use(cors());

app.get('/{*any}', (_, res) => {
  res.sendFile(path.resolve(process.cwd(), 'public', 'index.html'));
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

  const pushLobbies = () => {
    io.emit(
      'push-lobbies',
      Object.values(lobbies)
        .filter((lobby) => lobby.acceptingPlayers())
        .map((lobby) => lobby.getData())
    );
  };

  socket.on('query-lobbies', (callback) => {
    withErrorHandling(() => {
      callback(
        Object.values(lobbies)
          .filter((lobby) => lobby.acceptingPlayers())
          .map((lobby) => lobby.getData())
      );
    });
  });

  socket.on('host', () => {
    withErrorHandling(() => {
      const id = nanoid();
      lobbies[id] = new Lobby(id, socket.id);
      socket.join(id);
      io.to(id).emit('lobby-update', lobbies[id].getData());
      pushLobbies();
      console.log('lobby created:', id);
    });
  });

  socket.on('join-lobby', (id) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      const playerData = lobby.join(socket.id);
      socket.join(id);
      pushLobbies();
      io.to(id).emit('lobby-update', lobby.getData());
      socket.broadcast.to(id).emit('lobby-player-join', playerData);
    });
  });

  socket.on('leave-lobby', (id) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      const playerData = lobby.getPlayer(socket.id);
      if (playerData) {
        socket.leave(id);
        if (lobby.leave(socket.id)) {
          console.log('destroy lobby', id);
          delete lobbies[id];
        } else {
          io.to(id).emit('lobby-update', lobby.getData());
          io.to(id).emit('lobby-player-leave', playerData);
        }
        pushLobbies();
      }
    });
  });

  socket.on('update-params', ([id, params]) => {
    withErrorHandling(() => {
      const lobby = lobbies[id];
      if (!lobby) {
        throw new Error('Lobby does not exist!');
      }
      if (!lobby.isHost(socket.id)) {
        throw new Error('Only the lobby host can change params');
      }
      lobby.setParams(params);
      io.to(id).emit('lobby-update', lobby.getData());
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
      pushLobbies();
    });
  });

  const forward = (event: string) => {
    socket.on(`send/${event}`, ([id, data]) => {
      withErrorHandling(() => {
        const lobby = lobbies[id];
        if (!lobby) {
          throw new Error('Lobby does not exist!');
        }
        socket.broadcast.to(id).emit(`receive/${event}`, data);
      });
    });
  };

  // todo: use GameEvents type
  forward('setup-table');
  forward('system-state');
  forward('pickup-ball');
  forward('move-ball');
  forward('place-ball');
  forward('move-cue');
  forward('shoot');
  forward('params');

  socket.on('disconnect', () => {
    Object.entries(lobbies).forEach(([lobbyId, lobby]) => {
      const playerData = lobby.getPlayer(socket.id);
      if (playerData) {
        socket.leave(lobbyId);
        if (lobby.leave(socket.id)) {
          console.log('destroy lobby', lobbyId);
          delete lobbies[lobbyId];
        } else {
          io.to(lobbyId).emit('lobby-update', lobby.getData());
          io.to(lobbyId).emit('lobby-player-leave', playerData);
        }
        pushLobbies();
      }
    });
  });
});

server.listen(3005, () => {
  console.log('listening on :3005');
});
