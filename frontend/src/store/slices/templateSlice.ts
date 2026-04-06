import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';

export interface TemplateTask {
  title: string;
  description?: string;
  priority: string;
}

export interface TemplateMilestone {
  title: string;
  description?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tasks: TemplateTask[];
  milestones: TemplateMilestone[];
  createdBy: string;
  createdAt: string;
}

interface TemplateState {
  templates: ProjectTemplate[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TemplateState = {
  templates: [],
  isLoading: false,
  error: null,
};

export const fetchTemplates = createAsyncThunk('templates/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/templates');
    return data.templates;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch templates');
  }
});

export const createTemplate = createAsyncThunk(
  'templates/create',
  async (payload: { name: string; description?: string; category?: string; tasks?: TemplateTask[]; milestones?: TemplateMilestone[] }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/templates', payload);
      return data.template;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create template');
    }
  }
);

export const createTemplateFromProject = createAsyncThunk(
  'templates/createFromProject',
  async ({ projectId, name }: { projectId: string; name: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/templates/from-project/${projectId}`, { name });
      return data.template;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create template from project');
    }
  }
);

export const deleteTemplate = createAsyncThunk('templates/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/templates/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete template');
  }
});

const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.unshift(action.payload);
      })
      .addCase(createTemplateFromProject.fulfilled, (state, action) => {
        state.templates.unshift(action.payload);
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter((t) => t.id !== action.payload);
      });
  },
});

export default templateSlice.reducer;
