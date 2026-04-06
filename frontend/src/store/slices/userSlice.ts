import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { User } from '../../types';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  isLoading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchAll', async (params: { role?: string; status?: string; search?: string } | void, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users', { params: params || {} });
    return data.users;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to loaded users');
  }
});

export const fetchActiveUsers = createAsyncThunk('users/fetchActive', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/active');
    return data.users;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch active users');
  }
});

export const createUser = createAsyncThunk('users/create', async (userData: Partial<User>, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/users', userData);
    return data.user;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create user');
  }
});

export const updateUser = createAsyncThunk('users/update', async ({ id, data }: { id: string; data: Partial<User> }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/users/${id}`, data);
    return response.data.user;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update user');
  }
});

export const updateUserRole = createAsyncThunk('users/updateRole', async ({ id, role }: { id: string; role: 'manager' | 'employee' }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data.user;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update role');
  }
});

export const updateUserStatus = createAsyncThunk('users/updateStatus', async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/users/${id}/status`, { isActive });
    return data.user;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update status');
  }
});

export const deleteUser = createAsyncThunk('users/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/users/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete user');
  }
});

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchUsers
    builder.addCase(fetchUsers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // fetchActiveUsers
    builder.addCase(fetchActiveUsers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchActiveUsers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchActiveUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // createUser
    builder.addCase(createUser.fulfilled, (state, action) => {
      const exists = state.users.some(u => u.id === action.payload.id);
      if (!exists) {
        state.users.unshift(action.payload);
      }
    });

    // updateUser
    builder.addCase(updateUser.fulfilled, (state, action) => {
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    });

    // updateUserRole & Status
    const mapUpdatedUser = (state: UserState, action: { payload: User }) => {
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload };
      }
    };
    builder.addCase(updateUserRole.fulfilled, mapUpdatedUser);
    builder.addCase(updateUserStatus.fulfilled, mapUpdatedUser);

    // deleteUser
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.users = state.users.filter((u) => u.id !== action.payload);
    });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
