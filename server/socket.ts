import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { log } from './vite';

let io: Server;

export function setupSocketIO(httpServer: HttpServer): Server {
  // Create Socket.IO server
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'
  });

  // Socket connection event handlers
  io.on('connection', (socket: Socket) => {
    log(`Socket connected: ${socket.id}`, 'socket');

    // Handle disconnections
    socket.on('disconnect', () => {
      log(`Socket disconnected: ${socket.id}`, 'socket');
    });

    // Handle errors
    socket.on('error', (error) => {
      log(`Socket error: ${error}`, 'socket');
    });
  });

  return io;
}

/**
 * Emit an event to all connected clients
 * @param event Event name
 * @param data Event data
 */
export function emitToAll(event: string, data: any): void {
  if (!io) {
    log('Socket.IO not initialized yet', 'socket');
    return;
  }
  
  log(`Emitting ${event} to all clients`, 'socket');
  io.emit(event, data);
}

/**
 * Emit an event to a specific client
 * @param socketId Client socket ID
 * @param event Event name
 * @param data Event data
 */
export function emitToClient(socketId: string, event: string, data: any): void {
  if (!io) {
    log('Socket.IO not initialized yet', 'socket');
    return;
  }
  
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    log(`Emitting ${event} to client ${socketId}`, 'socket');
    socket.emit(event, data);
  } else {
    log(`Client ${socketId} not found`, 'socket');
  }
}