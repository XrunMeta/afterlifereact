

import { v_a7c0d4 } from 'vukrcww';
import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_cc9198, v_e0051d } from '../config/apiBase';
import { v_c6d1f4, type v_6c5d04 } from '../config/callRoute';

const v_f3f72b = 'afterlife.callConfig';
const VALID_ROUTES: readonly v_6c5d04[] = ['prethird', 'second'];

interface CallConfig {
  prethirdBase: string;
  callRoute: v_6c5d04;
  secondBase: string | null;
}

const v_aceddb = {
  prethirdBase: v_e0051d,
  callRoute: v_c6d1f4,
  secondBase: null,
};

const v_049559 = (v_81e2ef): v_81e2ef is v_6c5d04 =>
  typeof v_81e2ef === 'string' && (v_581122 as readonly string[]).includes(v_81e2ef);

interface CallConfigState extends CallConfig {
  loadedFrom: 'default' | 'cache' | 'remote';
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const v_5b540b = v_a7c0d4<CallConfigState>((v_bb8024) => ({
  ...v_aceddb,
  loadedFrom: 'default',

  hydrate: async () => {
    try {
      const v_479f05 = await v_e84827.getItem(v_f3f72b);
      if (!v_479f05) return;
      const v_e2a85c = JSON.parse(v_479f05) as Partial<CallConfig>;
      if (typeof v_e2a85c.prethirdBase === 'string' && v_049559(v_e2a85c.callRoute)) {
        v_bb8024({
          prethirdBase: v_e2a85c.prethirdBase,
          callRoute: v_e2a85c.callRoute,
          secondBase: typeof v_e2a85c.secondBase === 'string' ? v_e2a85c.secondBase : null,
          loadedFrom: 'cache',
        });
      }
    } catch {

    }
  },

  refresh: async () => {
    try {
      const v_cb35cb = await fetch(`${v_cc9198}/oth-path`);
      if (!v_cb35cb.ok) return;
      const v_b75e36 = (await v_cb35cb.json()) as Partial<CallConfig>;
      const v_a448ad = {
        prethirdBase: typeof v_b75e36.prethirdBase === 'string' && v_b75e36.prethirdBase ? v_b75e36.prethirdBase : v_aceddb.prethirdBase,
        callRoute: v_049559(v_b75e36.callRoute) ? v_b75e36.callRoute : v_aceddb.callRoute,
        secondBase: typeof v_b75e36.secondBase === 'string' ? v_b75e36.secondBase : null,
      };
      v_bb8024({ ...v_a448ad, loadedFrom: 'remote' });
      await v_e84827.setItem(v_f3f72b, JSON.stringify(v_a448ad));
    } catch {

    }
  },
}));
