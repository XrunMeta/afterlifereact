

import { v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';

export const v_19a43d = 45;

export function v_6ee99d(v_f11069, v_8d3ec6): number {
  if (v_8d3ec6 <= 0) return 0;
  return v_f11069 < v_8d3ec6 ? v_f11069 + 1 : v_f11069;
}

const v_531cae = 0xd800;
const v_487242 = 0xdbff;

export function v_f0496e(v_5f5d6d, v_f11069): string {
  if (!v_5f5d6d) return '';
  let v_f4e98d = Math.min(Math.max(v_f11069, 0), v_5f5d6d.length);
  if (v_f4e98d > 0) {
    const v_90efd3 = v_5f5d6d.charCodeAt(v_f4e98d - 1);
    if (v_90efd3 >= v_531cae && v_90efd3 <= v_487242) {
      v_f4e98d -= 1;
    }
  }
  return v_5f5d6d.slice(0, v_f4e98d);
}

export function v_f42541(v_5f5d6d, v_05ad58 = v_19a43d): string {
  const [v_f11069, v_828401] = v_5ab095(0);
  const v_b930a3 = v_e662ae(v_5f5d6d);
  const v_1e1f71 = v_e662ae<ReturnType<typeof setInterval> | null>(null);

  v_c4deb2(() => {
    v_b930a3.current = v_5f5d6d;
  }, [v_5f5d6d]);

  v_c4deb2(() => {
    if (!v_5f5d6d) {

      if (v_1e1f71.current) {
        clearInterval(v_1e1f71.current);
        v_1e1f71.current = null;
      }
      v_828401(0);
      return undefined;
    }
    if (v_1e1f71.current) {

      return undefined;
    }
    v_1e1f71.current = setInterval(() => {
      v_828401((v_ba2215) => v_6ee99d(v_ba2215, v_b930a3.current.length));
    }, v_05ad58);
    return undefined;

  }, [v_5f5d6d, v_05ad58]);

  v_c4deb2(() => {
    return () => {
      if (v_1e1f71.current) {
        clearInterval(v_1e1f71.current);
        v_1e1f71.current = null;
      }
    };
  }, []);

  return v_f0496e(v_5f5d6d, v_f11069);
}
