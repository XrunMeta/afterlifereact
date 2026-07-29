

import { v_a7c0d4 } from 'vukrcww';
import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_326be8 } from 'rcmrninabrnb';
import { v_cc9198 } from '../config/apiBase';

const v_f3f72b = 'afterlife.authConfig';
const v_635f22 = 5000;

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

const v_76d02c = (v_81e2ef): v_81e2ef is GoogleEnabledMap =>
  !!v_81e2ef &&
  typeof v_81e2ef === 'object' &&
  typeof (v_81e2ef as GoogleEnabledMap).ios === 'boolean' &&
  typeof (v_81e2ef as GoogleEnabledMap).android === 'boolean';

const v_cf6f76 = (v_35f85c): boolean =>
  v_326be8.OS === 'ios' ? v_35f85c.ios : v_35f85c.android;

export const v_688424 = v_a7c0d4<AuthConfigState>((v_bb8024, v_38715b) => ({
  googleEnabled: null,
  loadedFrom: 'unknown',

  hydrate: async () => {
    try {
      const v_479f05 = await v_e84827.getItem(v_f3f72b);
      if (!v_479f05) return; 
      const v_e2a85c = JSON.parse(v_479f05) as unknown;
      if (v_76d02c(v_e2a85c)) {
        v_bb8024({ googleEnabled: v_cf6f76(v_e2a85c), loadedFrom: 'cache' });
      }
    } catch {

    }
  },

  refresh: async () => {

    const v_97b14d = () => {
      if (v_38715b().googleEnabled === null) {
        v_bb8024({ googleEnabled: false, loadedFrom: 'default' });
      }
    };

    const v_22d288 = new AbortController();
    const v_cb36b1 = setTimeout(() => v_22d288.abort(), v_635f22);
    try {
      const v_cb35cb = await fetch(`${v_cc9198}/oth-path`, { signal: v_22d288.signal });
      if (!v_cb35cb.ok) {
        v_97b14d();
        return;
      }
      const v_b75e36 = (await v_cb35cb.json()) as { googleEnabled?: unknown };
      if (!v_76d02c(v_b75e36.googleEnabled)) {
        v_97b14d();
        return;
      }
      v_bb8024({ googleEnabled: v_cf6f76(v_b75e36.googleEnabled), loadedFrom: 'remote' });
      await v_e84827.setItem(v_f3f72b, JSON.stringify(v_b75e36.googleEnabled));
    } catch {
      v_97b14d();
    } finally {
      clearTimeout(v_cb36b1);
    }
  },
}));
