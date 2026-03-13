import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a project room
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project:${projectId}`);
    });

    // Leave a project room
    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Task moved (Kanban drag)
    socket.on('task:move', (data: { taskId: string; newStatus: string; position: number; projectId: string }) => {
      socket.to(`project:${data.projectId}`).emit('task:moved', data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
