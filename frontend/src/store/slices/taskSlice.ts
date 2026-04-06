import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { Task } from '../../types';

interface TaskState {
  tasks: Task[];
  projectTasks: Task[]; // Tasks scoped to a specific project
  currentTaskSubtasks: Task[]; // Subtasks for the currently viewed task
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  projectTasks: [],
  currentTaskSubtasks: [],
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

// Fetch subtasks for a task
export const fetchSubtasks = createAsyncThunk('tasks/fetchSubtasks', async (taskId: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/tasks/${taskId}/subtasks`);
    return data.subtasks;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch subtasks');
  }
});

// Create a new task (Admin or Project Manager usually, but anyone can create unassigned)
export const createTask = createAsyncThunk('tasks/create', async ({ projectId, data }: { projectId: string; data: Partial<Task> }, { rejectWithValue }) => {
  try {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data.task;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create task');
  }
});

// Create a subtask
export const createSubtask = createAsyncThunk('tasks/createSubtask', async ({ taskId, data }: { taskId: string; data: Partial<Task> }, { rejectWithValue }) => {
  try {
    const response = await api.post(`/tasks/${taskId}/subtasks`, data);
    return response.data.subtask;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create subtask');
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
      if (action.payload.parentTaskId) {
        // If it's a subtask and we are viewing it
        if (!state.currentTaskSubtasks.some(t => t.id === action.payload.id)) {
           state.currentTaskSubtasks.push(action.payload);
        }
      } else {
        const exists = state.projectTasks.some(t => t.id === action.payload.id);
        if (!exists && state.projectTasks.length > 0 && action.payload.projectId === state.projectTasks[0].projectId) {
          state.projectTasks.push(action.payload);
        }
      }
    },
    taskUpdatedEvent: (state, action) => {
      if (action.payload.parentTaskId) {
        const sIndex = state.currentTaskSubtasks.findIndex(t => t.id === action.payload.id);
        if (sIndex !== -1) {
          state.currentTaskSubtasks[sIndex] = action.payload;
        }
      } else {
        const pIndex = state.projectTasks.findIndex((t) => t.id === action.payload.id);
        if (pIndex !== -1) {
          state.projectTasks[pIndex] = action.payload;
        }
        
        const mIndex = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (mIndex !== -1) {
          state.tasks[mIndex] = action.payload;
        }
      }
    },
    taskDeletedEvent: (state, action) => {
      state.projectTasks = state.projectTasks.filter((t) => t.id !== action.payload);
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      state.currentTaskSubtasks = state.currentTaskSubtasks.filter((t) => t.id !== action.payload);
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

    // Fetch Subtasks
    builder.addCase(fetchSubtasks.fulfilled, (state, action) => {
      state.currentTaskSubtasks = action.payload;
    });

    // Create Task / Subtask
    builder.addCase(createTask.fulfilled, (state, action) => {
      const exists = state.projectTasks.some(t => t.id === action.payload.id);
      if (!exists) {
        state.projectTasks.push(action.payload);
      }
    });
    builder.addCase(createSubtask.fulfilled, (state, action) => {
      const exists = state.currentTaskSubtasks.some(t => t.id === action.payload.id);
      if (!exists) {
        state.currentTaskSubtasks.push(action.payload);
      }
    });

    // Update Task
    builder.addCase(updateTask.fulfilled, (state, action) => {
      if (action.payload.parentTaskId) {
        const sIndex = state.currentTaskSubtasks.findIndex((t) => t.id === action.payload.id);
        if (sIndex !== -1) {
          state.currentTaskSubtasks[sIndex] = action.payload;
        }
      } else {
        const pIndex = state.projectTasks.findIndex((t) => t.id === action.payload.id);
        if (pIndex !== -1) {
          state.projectTasks[pIndex] = action.payload;
        }
        const mIndex = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (mIndex !== -1) {
          state.tasks[mIndex] = action.payload;
        }
      }
    });

    // Update Task Status
    builder.addCase(updateTaskStatus.fulfilled, (state, action) => {
      if (action.payload.parentTaskId) {
        const sIndex = state.currentTaskSubtasks.findIndex((t) => t.id === action.payload.id);
        if (sIndex !== -1) {
          state.currentTaskSubtasks[sIndex] = action.payload;
        }
      } else {
        const pIndex = state.projectTasks.findIndex((t) => t.id === action.payload.id);
        if (pIndex !== -1) {
          state.projectTasks[pIndex] = action.payload;
        }
        const mIndex = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (mIndex !== -1) {
          state.tasks[mIndex] = action.payload;
        }
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

    // Delete Task / Subtask
    builder.addCase(deleteTask.fulfilled, (state, action) => {
      state.projectTasks = state.projectTasks.filter((t) => t.id !== action.payload);
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      state.currentTaskSubtasks = state.currentTaskSubtasks.filter((t) => t.id !== action.payload);
    });
  },
});

export const { clearTaskError, taskCreatedEvent, taskUpdatedEvent, taskDeletedEvent } = taskSlice.actions;
export default taskSlice.reducer;
