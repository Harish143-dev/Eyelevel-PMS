import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { Todo } from '../../types';

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  todos: [],
  isLoading: false,
  error: null,
};

export const fetchTodos = createAsyncThunk('todos/fetchAll', async (params: { filter?: string; sortBy?: string } | undefined, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params?.filter) query.append('filter', params.filter);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    
    const { data } = await api.get(`/todos?${query.toString()}`);
    return data.todos;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch todos');
  }
});

export const createTodo = createAsyncThunk('todos/create', async (todoData: Partial<Todo>, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/todos', todoData);
    return data.todo;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create todo');
  }
});

export const updateTodo = createAsyncThunk('todos/update', async ({ id, data }: { id: string; data: Partial<Todo> }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/todos/${id}`, data);
    return response.data.todo;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update todo');
  }
});

export const deleteTodo = createAsyncThunk('todos/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/todos/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete todo');
  }
});

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    clearTodoError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todos = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.todos.unshift(action.payload);
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        const index = state.todos.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.todos = state.todos.filter(t => t.id !== action.payload);
      });
  },
});

export const { clearTodoError } = todoSlice.actions;
export default todoSlice.reducer;
