import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';

export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    avatarColor: string;
  };
}

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  documents: [],
  currentDocument: null,
  isLoading: false,
  error: null,
};

export const fetchProjectDocuments = createAsyncThunk(
  'documents/fetchProjectDocuments',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/projects/${projectId}/documents`);
      return response.data.documents;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

export const createDocument = createAsyncThunk(
  'documents/createDocument',
  async (data: { projectId: string; title: string; content?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/projects/${data.projectId}/documents`, data);
      return response.data.document;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create document');
    }
  }
);

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async (data: { id: string; title?: string; content?: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/documents/${data.id}`, data);
      return response.data.document;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update document');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/documents/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete document');
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearCurrentDocument: (state) => {
      state.currentDocument = null;
    },
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProjectDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchProjectDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createDocument.fulfilled, (state, action) => {
        state.documents.unshift(action.payload);
      })
      // Update
      .addCase(updateDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
        if (state.currentDocument?.id === action.payload.id) {
          state.currentDocument = action.payload;
        }
      })
      // Delete
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(d => d.id !== action.payload);
        if (state.currentDocument?.id === action.payload) {
          state.currentDocument = null;
        }
      });
  },
});

export const { clearCurrentDocument, setCurrentDocument } = documentSlice.actions;
export default documentSlice.reducer;
