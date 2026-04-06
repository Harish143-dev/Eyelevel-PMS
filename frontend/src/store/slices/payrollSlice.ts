import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api/axios';

export interface Salary {
  id: string;
  userId: string;
  baseSalary: number;
  hra: number;
  otherAllowances: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  user?: {
    name: string;
    designation: string;
  };
}

export interface Payslip {
  id: string;
  userId: string;
  month: number;
  year: number;
  basic: number;
  hra: number;
  allowances: number;
  grossPay: number;
  pf: number;
  esi: number;
  tax: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  createdAt: string;
}

interface PayrollState {
  salaries: Salary[];
  currentSalary: Salary | null;
  payslips: Payslip[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PayrollState = {
  salaries: [],
  currentSalary: null,
  payslips: [],
  isLoading: false,
  error: null,
};

export const fetchAllSalaries = createAsyncThunk('payroll/fetchAllSalaries', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/payroll/salaries');
    return data.salaries;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch salaries');
  }
});

export const fetchSalaryByUser = createAsyncThunk('payroll/fetchSalaryByUser', async (userId: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/payroll/salaries/${userId}`);
    return data.salary;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user salary');
  }
});

export const updateSalary = createAsyncThunk('payroll/updateSalary', async ({ userId, data }: { userId: string; data: Partial<Salary> }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/payroll/salaries/${userId}`, data);
    return response.data.salary;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update salary');
  }
});

export const fetchPayslipsByUser = createAsyncThunk('payroll/fetchPayslipsByUser', async (userId: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/payroll/payslips/${userId}`);
    return data.payslips;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch payslips');
  }
});

export const generatePayslip = createAsyncThunk('payroll/generatePayslip', async (payload: { userId: string; month: number; year: number }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/payroll/payslips/generate', payload);
    return data.payslip;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to generate payslip');
  }
});

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All Salaries
      .addCase(fetchAllSalaries.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchAllSalaries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.salaries = action.payload;
      })
      .addCase(fetchAllSalaries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Salary By User
      .addCase(fetchSalaryByUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchSalaryByUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSalary = action.payload;
      })
      .addCase(fetchSalaryByUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Salary
      .addCase(updateSalary.fulfilled, (state, action) => {
        state.currentSalary = action.payload;
        const index = state.salaries.findIndex(s => s.userId === action.payload.userId);
        if (index !== -1) {
          state.salaries[index] = { ...state.salaries[index], ...action.payload };
        } else {
          state.salaries.push(action.payload);
        }
      })
      // Fetch Payslips
      .addCase(fetchPayslipsByUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchPayslipsByUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payslips = action.payload;
      })
      .addCase(fetchPayslipsByUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Generate Payslip
      .addCase(generatePayslip.fulfilled, (state, action) => {
        state.payslips.unshift(action.payload);
      });
  },
});

export default payrollSlice.reducer;
