import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { Task } from '../../types';

interface TaskState {
  tasks: Task[];
  projectTasks: Task[]; // Tasks scoped to a specific project
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  projectTasks: [],
  isLoading: false,
  error: null,
};

// Fetch tasks for current user across all projects
export const fetchMyTasks = createAsyncThunk('tasks/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tasks/my');
    return data.tasks;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch your tasks');
  }
});

// Fetch tasks for a specific project
export const fetchProjectTasks = createAsyncThunk('tasks/fetchByProject', async (projectId: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/projects/${projectId}/tasks`);
    return data.tasks;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch project tasks');
  }
});

// Create a new task (Admin or Project Owner usually, but anyone can create unassigned)
export const createTask = createAsyncThunk('tasks/create', async ({ projectId, data }: { projectId: string; data: Partial<Task> }, { rejectWithValue }) => {
  try {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data.task;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create task');
  }
});

// Update a task (e.g., status, assign)
export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }: { id: string; data: Partial<Task> }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.task;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update task');
  }
});

// Update task status specifically
export const updateTaskStatus = createAsyncThunk('tasks/updateStatus', async ({ id, status }: { id: string; status: Task['status'] }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data.task;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update task status');
  }
});

// Update task position specifically
export const updateTaskPosition = createAsyncThunk('tasks/updatePosition', async ({ id, status, position }: { id: string; status: Task['status']; position: number }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/tasks/${id}/position`, { status, position });
    return response.data.task;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update task position');
  }
});

// Delete a task
export const deleteTask = createAsyncThunk('tasks/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete task');
  }
});


const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
    // Useful for real-time socket events later
    taskCreatedEvent: (state, action) => {
      // Only add if not already in list to avoid duplicates from socket vs fulfilled action
      const exists = state.projectTasks.some(t => t.id === action.payload.id);
      if (!exists && state.projectTasks.length > 0 && action.payload.projectId === state.projectTasks[0].projectId) {
        state.projectTasks.push(action.payload);
      }
    },
    taskUpdatedEvent: (state, action) => {
      const pIndex = state.projectTasks.findIndex((t) => t.id === action.payload.id);
      if (pIndex !== -1) {
        state.projectTasks[pIndex] = action.payload;
      }
      
      const mIndex = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (mIndex !== -1) {
        state.tasks[mIndex] = action.payload;
      }
    },
    taskDeletedEvent: (state, action) => {
      state.projectTasks = state.projectTasks.filter((t) => t.id !== action.payload);
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    // Fetch My Tasks
    builder.addCase(fetchMyTasks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMyTasks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.tasks = action.payload;
    });
    builder.addCase(fetchMyTasks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Project Tasks
    builder.addCase(fetchProjectTasks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProjectTasks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.projectTasks = action.payload;
    });
    builder.addCase(fetchProjectTasks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create Task
    builder.addCase(createTask.fulfilled, (state, action) => {
      const exists = state.projectTasks.some(t => t.id === action.payload.id);
      if (!exists) {
        state.projectTasks.push(action.payload);
      }
    });

    // Update Task
    builder.addCase(updateTask.fulfilled, (state, action) => {
      const pIndex = state.projectTasks.findIndex((t) => t.id === action.payload.id);
      if (pIndex !== -1) {
        state.projectTasks[pIndex] = action.payload;
      }
      const mIndex = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (mIndex !== -1) {
        state.tasks[mIndex] = action.payload;
      }
    });

    // Update Task Status
    builder.addCase(updateTaskStatus.fulfilled, (state, action) => {
      const pIndex = state.projectTasks.findIndex((t) => t.id === action.payload.id);
      if (pIndex !== -1) {
        state.projectTasks[pIndex] = action.payload;
      }
      const mIndex = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (mIndex !== -1) {
        state.tasks[mIndex] = action.payload;
      }
    });

    // Update Task Position
    builder.addCase(updateTaskPosition.fulfilled, (state, action) => {
      const pIndex = state.projectTasks.findIndex((t) => t.id === action.payload.id);
      if (pIndex !== -1) {
        state.projectTasks[pIndex] = action.payload;
      }
      const mIndex = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (mIndex !== -1) {
        state.tasks[mIndex] = action.payload;
      }
    });

    // Delete Task
    builder.addCase(deleteTask.fulfilled, (state, action) => {
      state.projectTasks = state.projectTasks.filter((t) => t.id !== action.payload);
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    });
  },
});

export const { clearTaskError, taskCreatedEvent, taskUpdatedEvent, taskDeletedEvent } = taskSlice.actions;
export default taskSlice.reducer;
