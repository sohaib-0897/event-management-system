import { createSlice } from '@reduxjs/toolkit';

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: { theme: 'light' },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
  },
});
export const { toggleTheme } = preferencesSlice.actions;
export default preferencesSlice.reducer;
