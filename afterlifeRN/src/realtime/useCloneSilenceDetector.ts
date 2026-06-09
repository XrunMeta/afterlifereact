

import { v_de06a3, v_c4deb2, v_df9f57, v_e662ae } from 'bapkr';
import {
  v_c506a5,
  v_7be8d9,
  v_396b87,
  v_ccce9c,
  type v_5a4c65,
} from './cloneSilence';

const v_fbb4dd = 200; 

export function v_724dd4(opts: {

  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;

  onResponseEnd: () => void;

  onResponseStart?: () => void;
  config?: Partial<v_5a4c65>;
}) {
  const v_01dcf5 = v_df9f57<v_5a4c65>(
    () => ({ ...v_ccce9c, ...v_328259.config }),

    [],
  );
  const v_61dda6 = v_e662ae(v_328259.onResponseEnd);
  v_c4deb2(() => { v_61dda6.current = v_328259.onResponseEnd; });
  const v_7e0e75 = v_e662ae(v_328259.onResponseStart);
  v_c4deb2(() => { v_7e0e75.current = v_328259.onResponseStart; });
  const v_b8908d = v_e662ae(v_328259.getStatsReport);
  v_c4deb2(() => { v_b8908d.current = v_328259.getStatsReport; });

  const v_1e1f71 = v_e662ae<ReturnType<typeof setInterval> | null>(null);
  const v_8d3dea = v_e662ae(v_396b87());

  const v_c622fb = v_e662ae(false);

  const v_3e54f8 = v_de06a3(() => {
    v_c622fb.current = false;
    if (v_1e1f71.current) {
      clearInterval(v_1e1f71.current);
      v_1e1f71.current = null;
    }
  }, []);

  const v_965edf = v_de06a3(() => {
    v_3e54f8();
    v_c622fb.current = true;
    v_8d3dea.current = v_396b87();
    v_1e1f71.current = setInterval(() => {
      void (async () => {
        let v_fbe91e;
        try {
          const v_e2a85c = v_b8908d.current();
          const v_2888b4 = v_e2a85c ? await v_e2a85c : null;
          v_fbe91e = v_7be8d9(v_2888b4);
        } catch {
          v_fbe91e = undefined;
        }

        if (!v_c622fb.current) return;
        const v_2c381c = v_8d3dea.current.phase;
        const v_a448ad = v_c506a5(v_8d3dea.current, v_fbe91e, v_fbb4dd, v_01dcf5);
        v_8d3dea.current = v_a448ad;

        if (v_a448ad.phase === 'active' && v_2c381c !== 'active') {
          try { v_7e0e75.current?.(); } catch {  }
        }
        if (v_a448ad.phase === 'ended') {
          v_3e54f8();
          v_61dda6.current();
        }
      })();
    }, v_fbb4dd);
  }, [v_3e54f8, v_01dcf5]);

  v_c4deb2(() => v_3e54f8, [v_3e54f8]);

  return { start: v_965edf, stop: v_3e54f8 };
}
