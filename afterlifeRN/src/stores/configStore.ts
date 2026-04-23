import { v_a7c0d4 } from 'vukrcww';
import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_553d97, v_138fd4 } from '../config/apiBase';

interface ConfigState {
  testMode: boolean;
  baseUrl: string;
  hydrate: () => Promise<void>;
  setTestMode: (v: boolean) => Promise<void>;
}

export const v_0b10a6 = v_a7c0d4<ConfigState>((v_bb8024) => ({
  testMode: false,
  baseUrl: v_553d97,
  hydrate: async () => {
    const v_479f05 = await v_e84827.getItem('afterlife.config');
    if (!v_479f05) return;
    try {
      const v_8decf8 = JSON.parse(v_479f05);
      const v_53fadb = !!v_8decf8.testMode;
      v_bb8024({ testMode: v_53fadb, baseUrl: v_53fadb ? v_138fd4 : v_553d97 });
    } catch {}
  },
  setTestMode: async (v_81e2ef) => {
    const v_c01615 = v_81e2ef ? v_138fd4 : v_553d97;
    v_bb8024({ testMode: v_81e2ef, baseUrl: v_c01615 });
    await v_e84827.setItem('afterlife.config', JSON.stringify({ testMode: v_81e2ef, baseUrl: v_c01615 }));
  },
}));
