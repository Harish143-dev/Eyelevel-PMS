import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import activityService from '../../services/activityService';
import type { User } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: !!localStorage.getItem('accessToken'),
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem('accessToken', data.accessToken);
      
      const logoUrl = data.user?.company?.settings?.logoUrl;
      console.log('Login logo cache:', logoUrl);
      if (logoUrl) {
        localStorage.setItem('companyLogo', logoUrl);
      } else {
        localStorage.removeItem('companyLogo');
      }

      // Start activity tracking session
      try {
        await activityService.startSession();
      } catch (err) {
        console.error('Failed to start activity session on login', err);
      }
      
      return data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; password: string; companyName: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      
      if (data.pending) {
        return { pending: true, message: data.message };
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.removeItem('companyLogo'); // Registration usually means no logo yet
      
      // Start activity tracking session
      try {
        await activityService.startSession();
      } catch (err) {
        console.error('Failed to start activity session on register', err);
      }

      return { pending: false, user: data.user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    
    const logoUrl = data.user?.company?.settings?.logoUrl;
    if (logoUrl) {
      localStorage.setItem('companyLogo', logoUrl);
    } else {
      localStorage.removeItem('companyLogo');
    }
    
    // Ensure session exists if authenticated
    try {
      const sessionId = localStorage.getItem('activity_session_id');
      if (!sessionId) {
        // We have an auth token but no active session tracked, start one
        await activityService.startSession();
      }
    } catch (err) {
      console.error('Failed to restore session on reload', err);
    }
    
    return data.user;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to get user');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await activityService.endSession('manual');
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('activity_session_id');
    localStorage.removeItem('companyLogo');
  }
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ id, data }: { id: string; data: { name: string; email: string; designation?: string | null; currentPassword?: string } }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/${id}/password`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update password');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.pending) {
          state.isAuthenticated = false;
          state.user = null;
          // You could optionally store the pending message in state if you want to display it somewhere generic, 
          // but typically the component handling registration handles the success message route redirect.
        } else {
          state.isAuthenticated = true;
          state.user = action.payload.user;
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // GetMe
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(getMe.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
