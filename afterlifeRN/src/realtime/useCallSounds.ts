

import { v_de06a3, v_c4deb2, v_df9f57 } from 'bapkr';
import { v_e82960 } from 'qmmwyqbwrg';

export function v_efd35e() {

  const v_9e1212 = v_df9f57(() => {
    const v_e2a85c = v_e82960(require('../../assets/sfx/dialing_soft.m4a'));
    v_e2a85c.loop = true;
    return v_e2a85c;
  }, []);
  const v_ffd29a = v_df9f57(
    () => v_e82960(require('../../assets/sfx/connect.m4a')),
    [],
  );

  v_c4deb2(
    () => () => {
      try { v_9e1212.remove(); } catch {  }
      try { v_ffd29a.remove(); } catch {  }
    },
    [v_9e1212, v_ffd29a],
  );

  const v_c58788 = v_de06a3(() => {

    console.log(`[Call][flow] +${Date.now()} sound.startDialingTone()`);
    try {

      void v_9e1212.seekTo(0);
      v_9e1212.play();
    } catch (v_49263d) {
      console.warn("[Call][flow] startDialingTone failed:", v_49263d);
    }
  }, [v_9e1212]);

  const v_7e7d2d = v_de06a3(() => {
    console.log(`[Call][flow] +${Date.now()} sound.stopDialingTone()`);
    try { v_9e1212.pause(); } catch {  }
  }, [v_9e1212]);

  const v_d99bc3 = v_de06a3(() => {
    console.log(`[Call][flow] +${Date.now()} sound.playConnect()`);
    try { v_9e1212.pause(); } catch {  }
    try {
      void v_ffd29a.seekTo(0);
      v_ffd29a.play();
    } catch (v_49263d) {
      console.warn("[Call][flow] playConnect failed:", v_49263d);
    }
  }, [v_9e1212, v_ffd29a]);

  return v_df9f57(
    () => ({ startDialingTone: v_c58788, stopDialingTone: v_7e7d2d, playConnect: v_d99bc3 }),
    [v_c58788, v_7e7d2d, v_d99bc3],
  );
}
