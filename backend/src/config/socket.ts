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

    // Join user-specific room for notifications
    socket.on('user:join', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined user:${userId}`);
    });

    // Join admin activity room
    socket.on('admin:join_activity', () => {
      socket.join('admin:activity');
      console.log(`Socket ${socket.id} joined admin:activity`);
    });
    
    socket.on('admin:leave_activity', () => {
      socket.leave('admin:activity');
    });

    // Join a project room
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project:${projectId}`);
    });

    // Leave a project room
    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Join a chat channel room
    socket.on('channel:join', (channelId: string) => {
      socket.join(`channel:${channelId}`);
      console.log(`Socket ${socket.id} joined channel:${channelId}`);
    });

    // Leave a chat channel room
    socket.on('channel:leave', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
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
