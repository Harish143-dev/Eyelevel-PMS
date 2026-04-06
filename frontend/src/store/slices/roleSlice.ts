import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  isSystemRole: boolean;
  companyId: string | null;
  _count?: { users: number };
}

interface RoleState {
  roles: Role[];
  currentRole: Role | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RoleState = {
  roles: [],
  currentRole: null,
  isLoading: false,
  error: null,
};

export const fetchRoles = createAsyncThunk('roles/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/roles');
    return data.roles;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
  }
});

export const fetchRoleById = createAsyncThunk('roles/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/roles/${id}`);
    return data.role;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch role');
  }
});

export const createRole = createAsyncThunk(
  'roles/create',
  async (payload: { name: string; permissions: string[] }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/roles', payload);
      return data.role;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create role');
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/update',
  async ({ id, ...payload }: { id: string; name?: string; permissions?: string[] }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/roles/${id}`, payload);
      return data.role;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update role');
    }
  }
);

export const deleteRole = createAsyncThunk('roles/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/roles/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete role');
  }
});

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearRoleError: (state) => { state.error = null; },
    clearCurrentRole: (state) => { state.currentRole = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchRoles.fulfilled, (state, action) => { state.isLoading = false; state.roles = action.payload; })
      .addCase(fetchRoles.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(fetchRoleById.fulfilled, (state, action) => { state.currentRole = action.payload; })
      .addCase(createRole.fulfilled, (state, action) => { state.roles.push(action.payload); })
      .addCase(updateRole.fulfilled, (state, action) => {
        const idx = state.roles.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.roles[idx] = action.payload;
        if (state.currentRole?.id === action.payload.id) state.currentRole = action.payload;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter((r) => r.id !== action.payload);
      });
  },
});

export const { clearRoleError, clearCurrentRole } = roleSlice.actions;
export default roleSlice.reducer;
