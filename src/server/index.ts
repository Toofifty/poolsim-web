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
      lobby.join(socket.id);
      socket.join(id);
      pushLobbies();
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
    socket.on(event, ([id, data]) => {
      withErrorHandling(() => {
        const lobby = lobbies[id];
        if (!lobby) {
          throw new Error('Lobby does not exist!');
        }
        socket.broadcast.to(id).emit(event, data);
      });
    });
  };

  forward('setup-table');
  forward('reset-cue-ball');
  forward('set-game-state');
  forward('place-ball-in-hand');
  forward('update-ball-in-hand');
  forward('update-cue');
  forward('shoot');

  socket.on('disconnect', () => {
    Object.entries(lobbies).forEach(([lobbyId, lobby]) => {
      if (lobby.hasPlayer(socket.id)) {
        socket.leave(lobbyId);
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

server.listen(3005, () => {
  console.log('listening on :3005');
});
