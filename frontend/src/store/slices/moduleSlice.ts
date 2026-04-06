import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ModuleType = 'pm' | 'hr' | null;

interface ModuleState {
  activeModule: ModuleType;
}

const saved = localStorage.getItem('activeModule') as ModuleType;

const initialState: ModuleState = {
  activeModule: saved || null,
};

const moduleSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {
    setActiveModule: (state, action: PayloadAction<ModuleType>) => {
      state.activeModule = action.payload;
      if (action.payload) {
        localStorage.setItem('activeModule', action.payload);
      } else {
        localStorage.removeItem('activeModule');
      }
    },
  },
});

export const { setActiveModule } = moduleSlice.actions;
export default moduleSlice.reducer;
