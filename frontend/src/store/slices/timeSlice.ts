import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { TimeLog } from '../../types';

interface TimeState {
  logs: TimeLog[];
  runningTimer: TimeLog | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TimeState = {
  logs: [],
  runningTimer: null,
  isLoading: false,
  error: null,
};

export const fetchTimeLogs = createAsyncThunk(
  'time/fetchLogs',
  async (params: { taskId?: string; projectId?: string; startDate?: string; endDate?: string; userId?: string } | void, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) query.append(key, value);
        });
      }
      const { data } = await api.get(`/time/logs?${query.toString()}`);
      return data.logs;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch time logs');
    }
  }
);

export const fetchRunningTimer = createAsyncThunk('time/fetchRunning', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/time/running');
    return data.runningTimer;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch running timer');
  }
});

export const startTimer = createAsyncThunk(
  'time/start',
  async ({ taskId, description }: { taskId: string; description?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/time/start', { taskId, description });
      return data.timeLog;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to start timer');
    }
  }
);

export const stopTimer = createAsyncThunk('time/stop', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/time/stop');
    return data.timeLog;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to stop timer');
  }
});

export const logTimeManual = createAsyncThunk(
  'time/logManual',
  async (logData: { taskId: string; duration: number; description?: string; startTime?: string; endTime?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/time/log', logData);
      return data.timeLog;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to log time');
    }
  }
);

export const deleteTimeLog = createAsyncThunk('time/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/time/logs/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete time log');
  }
});

const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    clearTimeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeLogs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTimeLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload;
      })
      .addCase(fetchTimeLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRunningTimer.fulfilled, (state, action) => {
        state.runningTimer = action.payload;
      })
      .addCase(startTimer.fulfilled, (state, action) => {
        state.runningTimer = action.payload;
      })
      .addCase(stopTimer.fulfilled, (state, action) => {
        state.runningTimer = null;
        state.logs.unshift(action.payload);
      })
      .addCase(logTimeManual.fulfilled, (state, action) => {
        state.logs.unshift(action.payload);
      })
      .addCase(deleteTimeLog.fulfilled, (state, action) => {
        state.logs = state.logs.filter((l) => l.id !== action.payload);
      });
  },
});

export const { clearTimeError } = timeSlice.actions;
export default timeSlice.reducer;
