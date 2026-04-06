import { io, Socket } from 'socket.io-client';
import { store } from '../../store';
import { taskCreatedEvent, taskUpdatedEvent, taskDeletedEvent } from '../../store/slices/taskSlice';
import { projectCreatedEvent, projectUpdatedEvent, projectDeletedEvent } from '../../store/slices/projectSlice';
import { addNotification } from '../../store/slices/notificationSlice';

class SocketService {
  public socket: Socket | null = null;
  private currentProjectId: string | null = null;
  private currentChannelId: string | null = null;
  private currentUserId: string | null = null;

  connect(userId?: string) {
    if (!this.socket) {
      const token = localStorage.getItem('accessToken');
      
      this.socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
        auth: { token },
        path: import.meta.env.VITE_API_URL ? '/socket.io' : '/api/socket.io', // Adjust path based on proxy or direct connect
        transports: ['websocket'],
        reconnection: true,
      });

      this.currentUserId = userId || null;

      this.socket.on('connect', () => {
        console.log('Socket connected');
        // Re-join if we were in a project
        if (this.currentProjectId) {
           this.socket?.emit('project:join', this.currentProjectId);
        }
        if (this.currentUserId) {
           this.socket?.emit('user:join', this.currentUserId);
        }
      });

      this.setupListeners();
    } else if (userId && this.currentUserId !== userId) {
      // If already connected but user ID changed (e.g. login)
      this.socket.emit('user:join', userId);
      this.currentUserId = userId;
    }
  }

  disconnect() {
    if (this.socket) {
      if (this.currentProjectId) {
        this.socket.emit('project:leave', this.currentProjectId);
      }
      if (this.currentChannelId) {
        this.socket.emit('channel:leave', this.currentChannelId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
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

  joinChannel(channelId: string) {
    if (this.socket) {
      if (this.currentChannelId && this.currentChannelId !== channelId) {
        this.socket.emit('channel:leave', this.currentChannelId);
      }
      this.socket.emit('channel:join', channelId);
      this.currentChannelId = channelId;
    }
  }

  leaveChannel(channelId: string) {
    if (this.socket && this.currentChannelId === channelId) {
      this.socket.emit('channel:leave', channelId);
      this.currentChannelId = null;
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('task:created', (task) => {
      store.dispatch(taskCreatedEvent(task));
      import('../../store/slices/dashboardSlice').then(m => store.dispatch(m.fetchUserDashboard() as any));
    });

    this.socket.on('task:updated', (task) => {
      store.dispatch(taskUpdatedEvent(task));
      import('../../store/slices/dashboardSlice').then(m => {
        store.dispatch(m.fetchAdminDashboard() as any);
        store.dispatch(m.fetchUserDashboard() as any);
      });
    });

    this.socket.on('task:deleted', (taskId) => {
      store.dispatch(taskDeletedEvent(taskId));
      import('../../store/slices/dashboardSlice').then(m => {
        store.dispatch(m.fetchAdminDashboard() as any);
        store.dispatch(m.fetchUserDashboard() as any);
      });
    });

    this.socket.on('task:moved', (data) => {
      if (data.id) {
         store.dispatch(taskUpdatedEvent(data));
      }
    });

    this.socket.on('project:created', (project) => {
      store.dispatch(projectCreatedEvent(project));
      // Re-fetch dashboard for admin workload stats
      import('../../store/slices/dashboardSlice').then(m => store.dispatch(m.fetchAdminDashboard() as any));
    });

    this.socket.on('project:updated', (project) => {
      store.dispatch(projectUpdatedEvent(project));
      import('../../store/slices/dashboardSlice').then(m => store.dispatch(m.fetchAdminDashboard() as any));
      import('../../store/slices/dashboardSlice').then(m => store.dispatch(m.fetchUserDashboard() as any));
    });

    this.socket.on('project:deleted', (projectId) => {
      store.dispatch(projectDeletedEvent(projectId));
      import('../../store/slices/dashboardSlice').then(m => store.dispatch(m.fetchAdminDashboard() as any));
      import('../../store/slices/dashboardSlice').then(m => store.dispatch(m.fetchUserDashboard() as any));
    });

    // Listen for new notifications
    this.socket.on('notification:new', (notification) => {
      store.dispatch(addNotification(notification));
    });

    // Listen for chat messages
    this.socket.on('chat:message', (message) => {
      import('../../store/slices/chatSlice').then(m => store.dispatch(m.receiveMessage(message)));
    });

    this.socket.on('chat:message_updated', (message) => {
      import('../../store/slices/chatSlice').then(m => store.dispatch(m.receiveEditedMessage(message)));
    });

    this.socket.on('chat:message_deleted', (data) => {
      import('../../store/slices/chatSlice').then(m => store.dispatch(m.receiveDeletedMessage(data)));
    });
  }
}

export const socketService = new SocketService();
