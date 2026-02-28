/**
 * 设置状态管理
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, AppSettings } from '../../types';
import { storageService } from '../../services/storageService';

const initialState: SettingsState = {
  settings: storageService.getDefaultSettings(),
  loading: false,
  error: null,
};

// Async Thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await storageService.getSettings();
      return settings;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settings: Partial<AppSettings>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const newSettings = {
        ...state.settings.settings,
        ...settings,
      };
      await storageService.saveSettings(newSettings);
      return newSettings;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setAIModel: (state, action: PayloadAction<string>) => {
      state.settings.ai.defaultModel = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.settings.ui.theme = action.payload;
    },
    setTemperature: (state, action: PayloadAction<number>) => {
      state.settings.ai.temperature = action.payload;
    },
    toggleStream: (state) => {
      state.settings.ai.streamEnabled = !state.settings.ai.streamEnabled;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 加载设置
      .addCase(loadSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload || storageService.getDefaultSettings();
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 更新设置
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const {
  setAIModel,
  setTheme,
  setTemperature,
  toggleStream,
  clearError,
} = settingsSlice.actions;

export default settingsSlice.reducer;
