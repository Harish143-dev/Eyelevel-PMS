import { io, Socket } from 'socket.io-client';
import { store } from '../../store';
import { taskCreatedEvent, taskUpdatedEvent, taskDeletedEvent } from '../../store/slices/taskSlice';

class SocketService {
  public socket: Socket | null = null;
  private currentProjectId: string | null = null;

  connect() {
    if (!this.socket) {
      const token = localStorage.getItem('accessToken');
      
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        // Re-join if we were in a project
        if (this.currentProjectId) {
           this.socket?.emit('project:join', this.currentProjectId);
        }
      });

      this.setupListeners();
    }
  }

  disconnect() {
    if (this.socket) {
      if (this.currentProjectId) {
        this.socket.emit('project:leave', this.currentProjectId);
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinProject(projectId: string) {
    if (this.socket) {
      if (this.currentProjectId && this.currentProjectId !== projectId) {
        this.socket.emit('project:leave', this.currentProjectId);
      }
      this.socket.emit('project:join', projectId);
      this.currentProjectId = projectId;
    }
  }

  leaveProject(projectId: string) {
    if (this.socket && this.currentProjectId === projectId) {
      this.socket.emit('project:leave', projectId);
      this.currentProjectId = null;
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('task:created', (task) => {
      store.dispatch(taskCreatedEvent(task));
    });

    this.socket.on('task:updated', (task) => {
      store.dispatch(taskUpdatedEvent(task));
    });

    this.socket.on('task:deleted', (taskId) => {
      store.dispatch(taskDeletedEvent(taskId));
    });

    this.socket.on('task:moved', (data) => {
      // In a real kanban move, we might need more logic, 
      // but for now taskUpdatedEvent might suffice if data is full task.
      // If data is partial, we handle it specifically.
      if (data.id) {
         store.dispatch(taskUpdatedEvent(data));
      }
    });

    // Handle project updates if needed, e.g., progress changes
  }
}

export const socketService = new SocketService();
