

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, PRETHIRD_BASE } from '../config/apiBase';
import { CALL_ROUTE, type CallRoute } from '../config/callRoute';

const CACHE_KEY = 'afterlife.callConfig';
const VALID_ROUTES: readonly CallRoute[] = ['prethird', 'second'];

interface CallConfig {
  prethirdBase: string;
  callRoute: CallRoute;
  secondBase: string | null;

  experimentalBase: string | null;
}

const DEFAULTS: CallConfig = {
  prethirdBase: PRETHIRD_BASE,
  callRoute: CALL_ROUTE,
  secondBase: null,
  experimentalBase: null,
};

const isValidRoute = (v: unknown): v is CallRoute =>
  typeof v === 'string' && (VALID_ROUTES as readonly string[]).includes(v);

interface CallConfigState extends CallConfig {
  loadedFrom: 'default' | 'cache' | 'remote';
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCallConfigStore = create<CallConfigState>((set) => ({
  ...DEFAULTS,
  loadedFrom: 'default',

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<CallConfig>;
      if (typeof p.prethirdBase === 'string' && isValidRoute(p.callRoute)) {
        set({
          prethirdBase: p.prethirdBase,
          callRoute: p.callRoute,
          secondBase: typeof p.secondBase === 'string' ? p.secondBase : null,
          experimentalBase: typeof p.experimentalBase === 'string' ? p.experimentalBase : null,
          loadedFrom: 'cache',
        });
      }
    } catch {

    }
  },

  refresh: async () => {
    try {
      const r = await fetch(`${API_BASE}/oth-path`);
      if (!r.ok) return;
      const j = (await r.json()) as Partial<CallConfig>;
      const next: CallConfig = {
        prethirdBase: typeof j.prethirdBase === 'string' && j.prethirdBase ? j.prethirdBase : DEFAULTS.prethirdBase,
        callRoute: isValidRoute(j.callRoute) ? j.callRoute : DEFAULTS.callRoute,
        secondBase: typeof j.secondBase === 'string' ? j.secondBase : null,
        experimentalBase: typeof j.experimentalBase === 'string' ? j.experimentalBase : null,
      };
      set({ ...next, loadedFrom: 'remote' });
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch {

    }
  },
}));
