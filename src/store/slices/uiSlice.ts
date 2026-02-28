/**
 * UI状态管理
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types';

const initialState: UIState = {
  theme: 'light',
  isLoading: false,
  toast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    showLoading: (state) => {
      state.isLoading = true;
    },
    hideLoading: (state) => {
      state.isLoading = false;
    },
    showToast: (
      state,
      action: PayloadAction<{
        message: string;
        type: 'success' | 'error' | 'info';
      }>
    ) => {
      state.toast = {
        visible: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideToast: (state) => {
      if (state.toast) {
        state.toast.visible = false;
      }
    },
  },
});

export const {
  setTheme,
  showLoading,
  hideLoading,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
