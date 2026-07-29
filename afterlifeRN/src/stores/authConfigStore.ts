

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE } from '../config/apiBase';

const CACHE_KEY = 'afterlife.authConfig';
const TIMEOUT_MS = 5000;

interface GoogleEnabledMap {
  ios: boolean;
  android: boolean;
}

type LoadedFrom = 'unknown' | 'cache' | 'remote' | 'default';

interface AuthConfigState {
  googleEnabled: boolean | null;
  loadedFrom: LoadedFrom;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
}

const isGoogleEnabledMap = (v: unknown): v is GoogleEnabledMap =>
  !!v &&
  typeof v === 'object' &&
  typeof (v as GoogleEnabledMap).ios === 'boolean' &&
  typeof (v as GoogleEnabledMap).android === 'boolean';

const pickPlatform = (m: GoogleEnabledMap): boolean =>
  Platform.OS === 'ios' ? m.ios : m.android;

export const useAuthConfigStore = create<AuthConfigState>((set, get) => ({
  googleEnabled: null,
  loadedFrom: 'unknown',

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return; 
      const p = JSON.parse(raw) as unknown;
      if (isGoogleEnabledMap(p)) {

        if (get().googleEnabled !== null) return;
        set({ googleEnabled: pickPlatform(p), loadedFrom: 'cache' });
      }
    } catch {

    }
  },

  refresh: async () => {

    const failClosed = () => {
      if (get().googleEnabled === null) {
        set({ googleEnabled: false, loadedFrom: 'default' });
      }
    };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(`${API_BASE}/oth-path`, { signal: ctrl.signal });
      if (!r.ok) {
        failClosed();
        return;
      }
      const j = (await r.json()) as { googleEnabled?: unknown };
      if (!isGoogleEnabledMap(j.googleEnabled)) {
        failClosed();
        return;
      }
      set({ googleEnabled: pickPlatform(j.googleEnabled), loadedFrom: 'remote' });
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(j.googleEnabled));
    } catch {
      failClosed();
    } finally {
      clearTimeout(timer);
    }
  },
}));
