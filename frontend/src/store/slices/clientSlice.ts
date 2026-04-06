import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  _count?: { projects: number };
  createdAt: string;
}

interface ClientState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  clients: [],
  isLoading: false,
  error: null,
};

export const fetchClients = createAsyncThunk('clients/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/clients');
    return data.clients;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch clients');
  }
});

export const createClient = createAsyncThunk('clients/create', async (clientData: Partial<Client>, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/clients', clientData);
    return data.client;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create client');
  }
});

export const updateClient = createAsyncThunk('clients/update', async ({ id, data }: { id: string; data: Partial<Client> }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/clients/${id}`, data);
    return response.data.client;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update client');
  }
});

export const deleteClient = createAsyncThunk('clients/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/clients/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete client');
  }
});

const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.clients.unshift({ ...action.payload, _count: { projects: 0 } });
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.clients.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = { ...state.clients[index], ...action.payload };
        }
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter((c) => c.id !== action.payload);
      });
  },
});

export default clientSlice.reducer;
