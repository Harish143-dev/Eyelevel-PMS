import axios from './api/axios';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  totalHours: number | null;
  status: 'present' | 'late' | 'absent' | 'on-leave';
  user?: {
    name: string;
    avatarColor: string;
  };
}

const attendanceService = {
  checkIn: async () => {
    const response = await axios.post('/attendance/check-in');
    return response.data.attendance as AttendanceRecord;
  },

  checkOut: async () => {
    const response = await axios.post('/attendance/check-out');
    return response.data.attendance as AttendanceRecord;
  },

  getTodayStatus: async () => {
    const response = await axios.get('/attendance/status');
    return response.data.attendance as AttendanceRecord | null;
  },

  getLogs: async (params?: { startDate?: string; endDate?: string; userId?: string }) => {
    const response = await axios.get('/attendance/logs', { params });
    return response.data.logs as AttendanceRecord[];
  },
};

export default attendanceService;
