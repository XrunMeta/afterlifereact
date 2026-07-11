
import { v_2c6b15, type v_c56f36 } from './timingEvents';

export function v_1b1534(): () => void {
  if (!__DEV__) return () => {};
  let v_110a8b = 0; 
  return v_2c6b15((events: v_c56f36[]) => {
    for (let v_ebec57 = v_110a8b; v_ebec57 < v_bf9904.length; v_ebec57++) {
      const v_9e86fd = v_bf9904[v_ebec57];

      console.log('[Call][timing]', v_9e86fd.type, 't=', v_9e86fd.tMs);
    }
    v_110a8b = v_bf9904.length;
  });
}
