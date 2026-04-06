import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';

export interface OKR {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  quarter: string;
  progress: number;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    avatarColor: string;
    designation: string;
  };
}

export interface Review {
  id: string;
  revieweeId: string;
  reviewerId: string;
  period: string;
  rating: number;
  feedback: string | null;
  status: string;
  createdAt: string;
  reviewee?: { name: string; avatarColor: string; };
  reviewer?: { name: string; avatarColor: string; };
}

interface PerformanceState {
  okrs: OKR[];
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PerformanceState = {
  okrs: [],
  reviews: [],
  isLoading: false,
  error: null,
};

// OKR Thunks
export const fetchOKRs = createAsyncThunk('performance/fetchOKRs', async (userId: string | undefined, { rejectWithValue }) => {
  try {
    const params = userId ? { userId } : {};
    const { data } = await api.get('/performance/okrs', { params });
    return data.okrs;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch OKRs');
  }
});

export const createOKR = createAsyncThunk('performance/createOKR', async (payload: Partial<OKR>, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/performance/okrs', payload);
    return data.okr;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create OKR');
  }
});

export const updateOKR = createAsyncThunk('performance/updateOKR', async ({ id, data }: { id: string, data: Partial<OKR> }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/performance/okrs/${id}`, data);
    return response.data.okr;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update OKR');
  }
});

export const deleteOKR = createAsyncThunk('performance/deleteOKR', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/performance/okrs/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete OKR');
  }
});

// Review Thunks
export const fetchReviews = createAsyncThunk('performance/fetchReviews', async (revieweeId: string | undefined, { rejectWithValue }) => {
  try {
    const params = revieweeId ? { revieweeId } : {};
    const { data } = await api.get('/performance/reviews', { params });
    return data.reviews;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch reviews');
  }
});

export const createReview = createAsyncThunk('performance/createReview', async (payload: Partial<Review>, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/performance/reviews', payload);
    return data.review;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create review');
  }
});

const performanceSlice = createSlice({
  name: 'performance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // OKRs
    builder
      .addCase(fetchOKRs.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchOKRs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.okrs = action.payload;
      })
      .addCase(fetchOKRs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createOKR.fulfilled, (state, action) => {
        state.okrs.unshift(action.payload);
      })
      .addCase(updateOKR.fulfilled, (state, action) => {
        const index = state.okrs.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.okrs[index] = { ...state.okrs[index], ...action.payload };
        }
      })
      .addCase(deleteOKR.fulfilled, (state, action) => {
        state.okrs = state.okrs.filter(o => o.id !== action.payload);
      });

    // Reviews
    builder
      .addCase(fetchReviews.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.reviews.unshift(action.payload);
      });
  },
});

export default performanceSlice.reducer;
