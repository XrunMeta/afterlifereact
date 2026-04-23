import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_PROD, API_BASE_PREVIEW } from '../config/apiBase';

interface ConfigState {
  testMode: boolean;
  baseUrl: string;
  hydrate: () => Promise<void>;
  setTestMode: (v: boolean) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  testMode: false,
  baseUrl: API_BASE_PROD,
  hydrate: async () => {
    const raw = await AsyncStorage.getItem('afterlife.config');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const testMode = !!parsed.testMode;
      set({ testMode, baseUrl: testMode ? API_BASE_PREVIEW : API_BASE_PROD });
    } catch {}
  },
  setTestMode: async (v) => {
    const baseUrl = v ? API_BASE_PREVIEW : API_BASE_PROD;
    set({ testMode: v, baseUrl });
    await AsyncStorage.setItem('afterlife.config', JSON.stringify({ testMode: v, baseUrl }));
  },
}));
