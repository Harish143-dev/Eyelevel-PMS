import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { Project } from '../../types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  categories: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  categories: [],
  isLoading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params: { search?: string; status?: string; category?: string; isArchived?: boolean; managerId?: string; deadline?: string } | void, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params) {
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.category) query.append('category', params.category);
      if (params.isArchived !== undefined) query.append('isArchived', String(params.isArchived));
      if (params.managerId) query.append('managerId', params.managerId);
      if (params.deadline) query.append('deadline', params.deadline);
    }
    const { data } = await api.get(`/projects?${query.toString()}`);
    return data.projects;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch projects');
  }
});

export const fetchCategories = createAsyncThunk('projects/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/projects/categories');
    return data.categories;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
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

export const createProject = createAsyncThunk('projects/create', async (projectData: Partial<Project> & { 
  memberIds?: string[];
  departmentId?: string | null;
  otherDepartmentIds?: string[];
  projectManagerId?: string | null;
}, { rejectWithValue }) => {
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

export const archiveProject = createAsyncThunk('projects/archive', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/projects/${id}/archive`);
    return data.project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to archive project');
  }
});

export const unarchiveProject = createAsyncThunk('projects/unarchive', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/projects/${id}/unarchive`);
    return data.project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to unarchive project');
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

export const addProjectMember = createAsyncThunk('projects/addMember', async ({ projectId, userId }: { projectId: string; userId: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/members`, { userId });
    return data.project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add member');
  }
});

export const addDepartmentToProject = createAsyncThunk('projects/addDepartment', async ({ projectId, departmentId }: { projectId: string; departmentId: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/members/department/${departmentId}`);
    return data.project; // Returns updated project
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add department members');
  }
});

export const removeProjectMember = createAsyncThunk('projects/removeMember', async ({ projectId, userId }: { projectId: string; userId: string }, { rejectWithValue }) => {
  try {
    await api.delete(`/projects/${projectId}/members/${userId}`);
    return { projectId, userId };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove member');
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
    projectCreatedEvent: (state, action) => {
      const exists = state.projects.some(p => p.id === action.payload.id);
      if (!exists) {
        state.projects.unshift(action.payload);
      }
    },
    projectUpdatedEvent: (state, action) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...action.payload };
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = { ...state.currentProject, ...action.payload };
      }
    },
    projectDeletedEvent: (state, action) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
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

    // Fetch categories
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
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
      if (action.payload.category && !state.categories.includes(action.payload.category)) {
         state.categories.push(action.payload.category);
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
      if (action.payload.category && !state.categories.includes(action.payload.category)) {
         state.categories.push(action.payload.category);
      }
    });

    // Archive / Unarchive
    builder.addCase(archiveProject.fulfilled, (state, action) => {
      state.projects = state.projects.filter(p => p.id !== action.payload.id);
      if (state.currentProject?.id === action.payload.id) {
         state.currentProject = { ...state.currentProject, ...action.payload };
      }
    });
    builder.addCase(unarchiveProject.fulfilled, (state, action) => {
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

    // Add Member
    builder.addCase(addProjectMember.fulfilled, (state, action) => {
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    });

    // Add Department Members
    builder.addCase(addDepartmentToProject.fulfilled, (state, action) => {
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    });

    // Remove Member
    builder.addCase(removeProjectMember.fulfilled, (state, action) => {
      if (state.currentProject?.id === action.payload.projectId) {
        state.currentProject.members = state.currentProject.members.filter(m => m.userId !== action.payload.userId);
      }
      const index = state.projects.findIndex(p => p.id === action.payload.projectId);
      if (index !== -1) {
        state.projects[index].members = state.projects[index].members.filter(m => m.userId !== action.payload.userId);
      }
    });
  },
});

export const { clearProjectError, clearCurrentProject, projectCreatedEvent, projectUpdatedEvent, projectDeletedEvent } = projectSlice.actions;
export default projectSlice.reducer;
