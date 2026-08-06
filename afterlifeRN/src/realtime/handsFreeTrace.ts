

import { IDLE_GREET_DELAYS_MS, type HandsFreeEffect, type HandsFreeEvent, type HandsFreeState } from './handsFree';
import { emitTimingEvent } from './timingEvents';

export function head20(t: string | undefined): string {
  if (!t) return '';
  return t.length <= 20 ? t : t.slice(0, 20);
}

function evSeqOf(ev: HandsFreeEvent): number | undefined {
  if (ev.type === 'SPEECH_START' || ev.type === 'RESPONSE_DONE') return ev.seq;
  return undefined;
}

export function classifyInterrupt(
  prev: HandsFreeState, next: HandsFreeState, ev: HandsFreeEvent, effects: HandsFreeEffect[],
): { act: string; faceKey: string; deferredTurns: number } | null {
  const had = prev.pendingInterrupt;
  const has = next.pendingInterrupt;
  const saying = effects.includes('SAY_INTERRUPT');
  if (saying) {
    const act =
      ev.type === 'FACE_INTERRUPT' ? 'say_now'
        : ev.type === 'INTERRUPT_FLUSH' ? 'flush_quiet'
          : 'flush_turn'; 
    return { act, faceKey: had?.faceKey ?? '', deferredTurns: had?.deferredTurns ?? 0 };
  }
  if (effects.includes('SAY_IDLE_GREETING')) {
    return { act: 'watchdog_say', faceKey: '', deferredTurns: next.idleGreetCount };
  }
  if (!had && has) return { act: 'queued', faceKey: has.faceKey, deferredTurns: has.deferredTurns };
  if (had && !has) {
    const act =
      ev.type === 'INTERRUPT_EXPIRED' ? 'expired'
        : ev.type === 'FINAL_RESULT' ? 'dropped_2turns'
          : 'cleared'; 
    return { act, faceKey: had.faceKey, deferredTurns: had.deferredTurns };
  }
  if (had && has && had.deferredTurns !== has.deferredTurns) {
    return { act: 'deferred', faceKey: has.faceKey, deferredTurns: has.deferredTurns };
  }
  return null;
}

export function traceDispatch(
  prev: HandsFreeState, next: HandsFreeState, ev: HandsFreeEvent, effects: HandsFreeEffect[],
): void {
  if (!__DEV__) return;
  const evSeq = evSeqOf(ev);
  if (evSeq != null && prev.activeSeq != null && evSeq !== prev.activeSeq) {
    emitTimingEvent('seq_drop', {
      sig: ev.type === 'SPEECH_START' ? 'speech_start' : 'speech_end',
      got: evSeq,
      want: prev.activeSeq,
    });
  }
  if (ev.type === 'INTERRUPT_EXPIRED' && prev.pendingInterrupt
    && ev.faceKey != null && ev.faceKey !== prev.pendingInterrupt.faceKey) {
    emitTimingEvent('interrupt', {
      act: 'expire_mismatch', faceKey: ev.faceKey, deferredTurns: prev.pendingInterrupt.deferredTurns,
    });
  }
  const intr = classifyInterrupt(prev, next, ev, effects);
  if (intr) emitTimingEvent('interrupt', intr);

  if (next === prev && effects.length === 0) return; 
  emitTimingEvent('fsm', {
    from: prev.phase,
    to: next.phase,
    ev: ev.type,
    effects: effects.join('|'),
    micOn: next.micOn,
    spk: next.userSpeaking,
    aseq: next.activeSeq,
    nseq: next.nextSeq,
    pseq: prev.activeSeq,
    pi: next.pendingInterrupt?.faceKey ?? null,
    pit: next.pendingInterrupt?.deferredTurns ?? 0,
    greet: next.idleGreetCount,
    gmax: IDLE_GREET_DELAYS_MS.length,
  });
}
