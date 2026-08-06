

import { v_2c6b15, type v_c56f36 } from './timingEvents';

export function v_1b1534(): () => void {
  if (!__DEV__) return () => {};
  let v_ea719c = true; 
  return v_2c6b15((events: v_c56f36[]) => {
    if (v_ea719c) {
      v_ea719c = false;
      return;
    }
    const v_9e86fd = v_bf9904[v_bf9904.length - 1];
    if (!v_9e86fd) return; 

    if (v_9e86fd.detail) console.log('[Call][timing]', v_9e86fd.type, 't=', v_9e86fd.tMs, v_9e86fd.detail);

    else console.log('[Call][timing]', v_9e86fd.type, 't=', v_9e86fd.tMs);
  });
}
