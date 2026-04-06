import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';

interface OnboardingState {
  hasCompany: boolean;
  setupCompleted: boolean;
  setupStep: number;
  company: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  hasCompany: false,
  setupCompleted: false, // Default false. We use auth payload to check actual status now.
  setupStep: 0,
  company: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const fetchOnboardingStatus = createAsyncThunk(
  'onboarding/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/onboarding/status');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get status');
    }
  }
);

export const submitStep1 = createAsyncThunk(
  'onboarding/step1',
  async (payload: { businessType?: string; address?: string; primaryColor?: string; logoUrl?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/onboarding/step-1', payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Step 1 failed');
    }
  }
);

export const submitStep2 = createAsyncThunk(
  'onboarding/step2',
  async (payload: { country?: string; timezone?: string; currency?: string; dateFormat?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/onboarding/step-2', payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Step 2 failed');
    }
  }
);

export const submitStep3 = createAsyncThunk(
  'onboarding/step3',
  async (payload: { workDays?: number[]; workHoursStart?: string; workHoursEnd?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/onboarding/step-3', payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Step 3 failed');
    }
  }
);

export const submitStep4 = createAsyncThunk(
  'onboarding/step4',
  async (payload: { emails?: string[]; features?: Record<string, boolean> }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/onboarding/step-4', payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Step 4 failed');
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  'onboarding/complete',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/onboarding/complete');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Completion failed');
    }
  }
);

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    resetOnboarding: () => initialState,
    markSetupComplete: (state) => {
      state.setupCompleted = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOnboardingStatus.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchOnboardingStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.hasCompany = action.payload.hasCompany ?? false;
        state.setupCompleted = action.payload.setupCompleted ?? false;
        state.setupStep = action.payload.setupStep ?? 0;
        state.company = action.payload.company ?? null;
      })
      .addCase(fetchOnboardingStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
      })
      .addCase(submitStep1.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(submitStep1.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasCompany = true;
        state.setupStep = action.payload.setupStep;
      })
      .addCase(submitStep1.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(submitStep2.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(submitStep2.fulfilled, (state, action) => { state.setupStep = action.payload.setupStep; state.isLoading = false; })
      .addCase(submitStep2.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(submitStep3.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(submitStep3.fulfilled, (state, action) => { state.setupStep = action.payload.setupStep; state.isLoading = false; })
      .addCase(submitStep3.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(submitStep4.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(submitStep4.fulfilled, (state, action) => { state.setupStep = action.payload.setupStep; state.isLoading = false; })
      .addCase(submitStep4.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(completeOnboarding.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(completeOnboarding.fulfilled, (state) => { state.setupCompleted = true; state.isLoading = false; })
      .addCase(completeOnboarding.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
  },
});

export const { resetOnboarding, markSetupComplete } = onboardingSlice.actions;
export default onboardingSlice.reducer;
