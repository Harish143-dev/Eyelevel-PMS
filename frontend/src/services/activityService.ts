import api from './api/axios';

export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  tabId: string;
  loginTime: string;
  logoutTime: string | null;
  lastActiveAt: string;
  isActive: boolean;
  logoutReason: string | null;
  ipAddress: string | null;
}

export interface ActivityStatusResponse {
  isOnline: boolean;
  currentStatus: 'active' | 'idle' | 'break' | 'offline';
  session: {
    id: string;
    loginTime: string;
    lastActiveAt: string;
  } | null;
  todaySummary: {
    totalSessionTime: number;
    totalActiveTime: number;
    totalIdleTime: number;
    totalBreakTime: number;
    productiveTime: number;
  };
}

export interface WorkSummary {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalSessionTime: number;
  totalActiveTime: number;
  totalIdleTime: number;
  totalBreakTime: number;
  productiveTime: number;
  attendanceStatus: 'present' | 'late' | 'half-day' | 'absent';
  lateMinutes: number;
  hasAnomaly: boolean;
  anomalyReason: string | null;
}

const generateRandomId = () => Math.random().toString(36).substring(2, 15);

const activityService = {
  // Session Management
  startSession: async (): Promise<UserSession | null> => {
    try {
      // Create deviceId if it doesn't exist
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = generateRandomId();
        localStorage.setItem('deviceId', deviceId);
      }

      // Tab ID is unique per browser tab
      const tabId = generateRandomId();
      sessionStorage.setItem('tabId', tabId);

      const response = await api.post('/session/login', {
        deviceId,
        tabId,
      });
      
      const session = response.data.session;
      localStorage.setItem('activity_session_id', session.id);
      return session;
    } catch (error) {
      console.error('Failed to start session:', error);
      return null;
    }
  },

  endSession: async (reason: string = 'manual'): Promise<void> => {
    try {
      const sessionId = localStorage.getItem('activity_session_id');
      if (sessionId) {
        await api.post('/session/logout', { sessionId, reason });
        localStorage.removeItem('activity_session_id');
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  },

  forceLogout: async (sessionId: string): Promise<void> => {
    await api.post('/session/force-logout', { sessionId });
  },

  getOnlineUsers: async () => {
    const response = await api.get('/session/admin/online');
    return response.data.onlineUsers;
  },

  // Heartbeat & status
  sendHeartbeat: async (payload: { status: string; source?: string; timestamp?: string }): Promise<void> => {
    const sessionId = localStorage.getItem('activity_session_id');
    if (!sessionId) return; // No active session

    await api.post('/activity-tracking', {
      sessionId,
      status: payload.status,
      source: payload.source || 'heartbeat',
      timestamp: payload.timestamp || new Date().toISOString(),
    });
  },

  sendBatchHeartbeats: async (heartbeats: any[]): Promise<void> => {
    if (heartbeats.length === 0) return;
    await api.post('/activity-tracking/batch', { heartbeats });
  },

  getMyStatus: async (): Promise<ActivityStatusResponse> => {
    const response = await api.get('/activity-tracking/my-status');
    return response.data;
  },

  getDailySummary: async (userId: string, date?: string): Promise<{ summary: WorkSummary }> => {
    const response = await api.get(`/activity-tracking/summary/${userId}${date ? `?date=${date}` : ''}`);
    return response.data;
  },

  getTeamSummary: async (date?: string) => {
    const response = await api.get(`/activity-tracking/admin/team-summary${date ? `?date=${date}` : ''}`);
    return response.data;
  },

  getAdminLiveStatus: async () => {
    const response = await api.get('/activity-tracking/admin/live');
    return response.data;
  },

  getAnomalies: async (days: number = 7) => {
    const response = await api.get(`/activity-tracking/admin/anomalies?days=${days}`);
    return response.data.anomalies;
  },
};

export default activityService;
