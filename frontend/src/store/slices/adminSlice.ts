import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { User, Project, Task } from '../../types';

interface AdminState {
  pendingUsers: User[];
  pendingCount: number;
  deletedProjects: Project[];
  deletedTasks: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  pendingUsers: [],
  pendingCount: 0,
  deletedProjects: [],
  deletedTasks: [],
  isLoading: false,
  error: null,
};

export const fetchPendingUsers = createAsyncThunk('admin/fetchPendingUsers', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/admin/pending-users');
    return data.users;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch pending users');
  }
});

export const fetchPendingCount = createAsyncThunk('admin/fetchPendingCount', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/admin/pending-count');
    return data.count;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch pending count');
  }
});

export const approveUser = createAsyncThunk('admin/approveUser', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/users/${id}/approve`);
    return data.user;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to approve user');
  }
});

export const rejectUser = createAsyncThunk('admin/rejectUser', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/users/${id}/reject`);
    return data.user;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to reject user');
  }
});

export const deactivateUser = createAsyncThunk('admin/deactivateUser', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/users/${id}/deactivate`);
    return data.user;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to deactivate user');
  }
});
export const fetchDeletedProjects = createAsyncThunk('admin/fetchDeletedProjects', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/projects/deleted');
    return data.projects;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch deleted projects');
  }
});

export const fetchDeletedTasks = createAsyncThunk('admin/fetchDeletedTasks', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tasks/deleted');
    return data.tasks;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch deleted tasks');
  }
});

export const restoreProject = createAsyncThunk('admin/restoreProject', async (id: string, { rejectWithValue }) => {
  try {
    await api.patch(`/projects/${id}/restore`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to restore project');
  }
});

export const restoreTask = createAsyncThunk('admin/restoreTask', async (id: string, { rejectWithValue }) => {
  try {
    await api.patch(`/tasks/${id}/restore`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to restore task');
  }
});

const adminSlice = createSlice({
  name: 'manager',
  initialState,
  reducers: {
    clearAdminError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPendingUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingUsers = action.payload;
        state.pendingCount = action.payload.length;
      })
      .addCase(fetchPendingUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPendingCount.fulfilled, (state, action) => {
        state.pendingCount = action.payload;
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        state.pendingUsers = state.pendingUsers.filter(u => u.id !== action.payload.id);
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      })
      .addCase(rejectUser.fulfilled, (state, action) => {
        state.pendingUsers = state.pendingUsers.filter(u => u.id !== action.payload.id);
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      })
      .addCase(fetchDeletedProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDeletedProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deletedProjects = action.payload;
      })
      .addCase(fetchDeletedProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDeletedTasks.fulfilled, (state, action) => {
        state.deletedTasks = action.payload;
      })
      .addCase(restoreProject.fulfilled, (state, action) => {
        state.deletedProjects = state.deletedProjects.filter(p => p.id !== action.payload);
      })
      .addCase(restoreTask.fulfilled, (state, action) => {
        state.deletedTasks = state.deletedTasks.filter(t => t.id !== action.payload);
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
