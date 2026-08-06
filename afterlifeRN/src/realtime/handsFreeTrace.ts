

import { v_6fc7ac, type v_a81c33, type v_01cdf6, type v_8cc739 } from './handsFree';
import { v_d7f7b1 } from './timingEvents';

export function v_4069c9(v_8d41d7): string {
  if (!v_8d41d7) return '';
  return v_8d41d7.length <= 20 ? v_8d41d7 : v_8d41d7.slice(0, 20);
}

function v_ff3772(ev: v_01cdf6): number | undefined {
  if (v_1d299c.type === 'SPEECH_START' || v_1d299c.type === 'RESPONSE_DONE') return v_1d299c.seq;
  return undefined;
}

export function v_bbb49e(
  prev: v_8cc739, next: v_8cc739, ev: v_01cdf6, effects: v_a81c33[],
): { act: string; faceKey: string; deferredTurns: number } | null {
  const v_efd8b7 = v_ba2215.pendingInterrupt;
  const v_4982f8 = v_a448ad.pendingInterrupt;
  const v_05234a = v_27ef63.includes('SAY_INTERRUPT');
  if (v_05234a) {
    const v_be73a0 =
      v_1d299c.type === 'FACE_INTERRUPT' ? 'say_now'
        : v_1d299c.type === 'INTERRUPT_FLUSH' ? 'flush_quiet'
          : 'flush_turn'; 
    return { act: v_be73a0, faceKey: v_efd8b7?.faceKey ?? '', deferredTurns: v_efd8b7?.deferredTurns ?? 0 };
  }
  if (v_27ef63.includes('SAY_IDLE_GREETING')) {
    return { act: 'watchdog_say', faceKey: '', deferredTurns: v_a448ad.idleGreetCount };
  }
  if (!v_efd8b7 && v_4982f8) return { act: 'queued', faceKey: v_4982f8.faceKey, deferredTurns: v_4982f8.deferredTurns };
  if (v_efd8b7 && !v_4982f8) {
    const v_be73a0 =
      v_1d299c.type === 'INTERRUPT_EXPIRED' ? 'expired'
        : v_1d299c.type === 'FINAL_RESULT' ? 'dropped_2turns'
          : 'cleared'; 
    return { act: v_be73a0, faceKey: v_efd8b7.faceKey, deferredTurns: v_efd8b7.deferredTurns };
  }
  if (v_efd8b7 && v_4982f8 && v_efd8b7.deferredTurns !== v_4982f8.deferredTurns) {
    return { act: 'deferred', faceKey: v_4982f8.faceKey, deferredTurns: v_4982f8.deferredTurns };
  }
  return null;
}

export function v_6a1ed9(
  prev: v_8cc739, next: v_8cc739, ev: v_01cdf6, effects: v_a81c33[],
): void {
  if (!__DEV__) return;
  const v_9cc855 = v_ff3772(v_1d299c);
  if (v_9cc855 != null && v_ba2215.activeSeq != null && v_9cc855 !== v_ba2215.activeSeq) {
    v_d7f7b1('seq_drop', {
      sig: v_1d299c.type === 'SPEECH_START' ? 'speech_start' : 'speech_end',
      got: v_9cc855,
      want: v_ba2215.activeSeq,
    });
  }
  if (v_1d299c.type === 'INTERRUPT_EXPIRED' && v_ba2215.pendingInterrupt
    && v_1d299c.faceKey != null && v_1d299c.faceKey !== v_ba2215.pendingInterrupt.faceKey) {
    v_d7f7b1('interrupt', {
      act: 'expire_mismatch', faceKey: v_1d299c.faceKey, deferredTurns: v_ba2215.pendingInterrupt.deferredTurns,
    });
  }
  const v_b40954 = v_bbb49e(v_ba2215, v_a448ad, v_1d299c, v_27ef63);
  if (v_b40954) v_d7f7b1('interrupt', v_b40954);

  if (v_a448ad === v_ba2215 && v_27ef63.length === 0) return; 
  v_d7f7b1('fsm', {
    from: v_ba2215.phase,
    to: v_a448ad.phase,
    ev: v_1d299c.type,
    effects: v_27ef63.join('|'),
    micOn: v_a448ad.micOn,
    spk: v_a448ad.userSpeaking,
    aseq: v_a448ad.activeSeq,
    nseq: v_a448ad.nextSeq,
    pseq: v_ba2215.activeSeq,
    pi: v_a448ad.pendingInterrupt?.faceKey ?? null,
    pit: v_a448ad.pendingInterrupt?.deferredTurns ?? 0,
    greet: v_a448ad.idleGreetCount,
    gmax: v_6fc7ac.length,
  });
}
