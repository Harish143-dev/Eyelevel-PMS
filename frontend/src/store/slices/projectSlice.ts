import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { Project } from '../../types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/projects');
    return data.projects;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch projects');
  }
});

export const fetchProjectById = createAsyncThunk('projects/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/projects/${id}`);
    return data.project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch project details');
  }
});

export const createProject = createAsyncThunk('projects/create', async (projectData: Partial<Project> & { memberIds: string[] }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/projects', projectData);
    return data.project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create project');
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, data }: { id: string; data: Partial<Project> }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update project');
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/projects/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete project');
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchProjects.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProjects.fulfilled, (state, action) => {
      state.isLoading = false;
      state.projects = action.payload;
    });
    builder.addCase(fetchProjects.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch single
    builder.addCase(fetchProjectById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.currentProject = null;
    });
    builder.addCase(fetchProjectById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentProject = action.payload;
    });
    builder.addCase(fetchProjectById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create
    builder.addCase(createProject.fulfilled, (state, action) => {
      const exists = state.projects.some(p => p.id === action.payload.id);
      if (!exists) {
        state.projects.unshift(action.payload);
      }
    });

    // Update
    builder.addCase(updateProject.fulfilled, (state, action) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...action.payload };
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = { ...state.currentProject, ...action.payload };
      }
    });

    // Delete
    builder.addCase(deleteProject.fulfilled, (state, action) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
    });
  },
});

export const { clearProjectError, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
