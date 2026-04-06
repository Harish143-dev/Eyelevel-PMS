import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { Department } from '../../types';

interface DepartmentState {
  departments: Department[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentState = {
  departments: [],
  loading: false,
  error: null,
};

export const fetchDepartments = createAsyncThunk('departments/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/departments');
    return response.data.departments;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
  }
});

export const createDepartment = createAsyncThunk('departments/create', async (data: { name: string; description?: string; color: string; userIds?: string[]; managerId?: string | null }, { rejectWithValue }) => {
  try {
    const response = await api.post('/departments', data);
    return response.data.department;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create department');
  }
});

export const updateDepartment = createAsyncThunk('departments/update', async ({ id, data }: { id: string; data: { name: string; description?: string; color: string; userIds?: string[]; managerId?: string | null } }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/departments/${id}`, data);
    return response.data.department;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update department');
  }
});

export const deleteDepartment = createAsyncThunk('departments/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/departments/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete department');
  }
});

const departmentSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDepartments.fulfilled, (state, action) => { state.loading = false; state.departments = action.payload; })
      .addCase(fetchDepartments.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      
      .addCase(createDepartment.fulfilled, (state, action) => { state.departments.push(action.payload); })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.departments.findIndex(d => d.id === action.payload.id);
        if (index !== -1) state.departments[index] = action.payload;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter(d => d.id !== action.payload);
      });
  },
});

export default departmentSlice.reducer;
