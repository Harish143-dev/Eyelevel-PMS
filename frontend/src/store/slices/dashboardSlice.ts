import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';

interface DashboardState {
  adminData: any | null;
  userData: any | null;
  activitiesData: {
    activities: any[];
    pagination: any;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  adminData: null,
  userData: null,
  activitiesData: null,
  isLoading: false,
  error: null,
};

export const fetchActivities = createAsyncThunk(
  'dashboard/fetchActivities',
  async ({ page, limit }: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/activity?page=${page}&limit=${limit}`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch activity logs');
    }
  }
);

export const fetchAdminDashboard = createAsyncThunk(
  'dashboard/fetchAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/dashboard/admin');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch admin dashboard');
    }
  }
);

export const fetchUserDashboard = createAsyncThunk(
  'dashboard/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/dashboard/user');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user dashboard');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Admin Dashboard
    builder.addCase(fetchAdminDashboard.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAdminDashboard.fulfilled, (state, action) => {
      state.isLoading = false;
      state.adminData = action.payload;
    });
    builder.addCase(fetchAdminDashboard.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // User Dashboard
    builder.addCase(fetchUserDashboard.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserDashboard.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userData = action.payload;
    });
    builder.addCase(fetchUserDashboard.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Activities
    builder.addCase(fetchActivities.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchActivities.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activitiesData = action.payload;
    });
    builder.addCase(fetchActivities.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export default dashboardSlice.reducer;
