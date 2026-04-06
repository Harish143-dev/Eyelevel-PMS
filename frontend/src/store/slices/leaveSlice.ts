import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { User } from '../../types';

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: 'CASUAL' | 'SICK' | 'UNPAID';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  adminNote: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatarColor' | 'designation'>;
}

interface LeaveState {
  myLeaves: LeaveRequest[];
  allLeaves: LeaveRequest[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  myLeaves: [],
  allLeaves: [],
  isLoading: false,
  error: null,
};

export const fetchMyLeaves = createAsyncThunk('leaves/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/leaves/my-leaves');
    return data.leaves;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch my leaves');
  }
});

export const fetchAllLeaves = createAsyncThunk('leaves/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/leaves/all');
    return data.leaves;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch all leaves');
  }
});

export const applyForLeave = createAsyncThunk('leaves/apply', async (payload: { startDate: string, endDate: string, type: string, reason: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/leaves/apply', payload);
    return data.leave;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to apply for leave');
  }
});

export const updateLeaveStatus = createAsyncThunk('leaves/updateStatus', async ({ id, status, adminNote }: { id: string, status: string, adminNote?: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/leaves/${id}/status`, { status, adminNote });
    return data.leave;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update leave status');
  }
});

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    clearLeaveError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMyLeaves.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMyLeaves.fulfilled, (state, action) => {
      state.isLoading = false;
      state.myLeaves = action.payload;
    });
    builder.addCase(fetchMyLeaves.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchAllLeaves.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAllLeaves.fulfilled, (state, action) => {
      state.isLoading = false;
      state.allLeaves = action.payload;
    });
    builder.addCase(fetchAllLeaves.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(applyForLeave.fulfilled, (state, action) => {
      state.myLeaves.unshift(action.payload);
    });

    builder.addCase(updateLeaveStatus.fulfilled, (state, action) => {
      const idx = state.allLeaves.findIndex(l => l.id === action.payload.id);
      if (idx !== -1) {
        state.allLeaves[idx] = { ...state.allLeaves[idx], ...action.payload };
      }
      const myIdx = state.myLeaves.findIndex(l => l.id === action.payload.id);
      if (myIdx !== -1) {
        state.myLeaves[myIdx] = { ...state.myLeaves[myIdx], ...action.payload };
      }
    });

  }
});

export const { clearLeaveError } = leaveSlice.actions;
export default leaveSlice.reducer;
