import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { log } from './vite';

let io: Server;

export function setupSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'
  });

  io.on('connection', (socket) => {
    log(`Socket connected: ${socket.id}`, 'socket');

    // Handle disconnection
    socket.on('disconnect', () => {
      log(`Socket disconnected: ${socket.id}`, 'socket');
    });
  });

  return io;
}

// Emit events to all connected clients
export function emitToAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

// Emit events to a specific client
export function emitToClient(socketId: string, event: string, data: any): void {
  if (io) {
    io.to(socketId).emit(event, data);
  }
}