

import type { TimingDetail, TimingEvent } from './timingEvents';

export type TimerName =
  | 'watchdog' | 'interruptFlush' | 'interruptExpire'
  | 'pendingDone' | 'signalGatingFallback' | 'cooldown';

export const TIMER_NAMES: readonly TimerName[] = [
  'watchdog', 'interruptFlush', 'interruptExpire', 'pendingDone', 'signalGatingFallback', 'cooldown',
];

export const TIMER_LABEL: Record<TimerName, string> = {
  watchdog: 'wd', interruptFlush: 'fl', interruptExpire: 'ex',
  pendingDone: 'pd', signalGatingFallback: 'sg', cooldown: 'cd',
};

export type RowTone = 'tx' | 'rx' | 'done' | 'warn' | 'dim' | 'info';

export interface TimelineRow {
  id: number;

  text: string;
  tone: RowTone;

  indent: boolean;
  tMs: number;
}

export interface TxTrack {
  seq: number | null;
  mode: string;
  tMs: number;

  startMs: number | null;

  endMs: number | null;

  doneMs: number | null;
}

export interface CallStateModel {
  phase: string;
  micOn: boolean;
  userSpeaking: boolean;
  activeSeq: number | null;
  nextSeq: number;
  pendingFace: string | null;
  pendingTurns: number;
  idleGreet: number;
  idleGreetMax: number;
  detector: boolean;
  avatarPhase: string;
  avatarBusy: number;

  timers: Record<TimerName, number | null>;
  lastTx: TxTrack | null;
  seqDrops: number;
  rows: TimelineRow[];
  nextRowId: number;
}

const MAX_ROWS = 200;

export function initCallStateModel(): CallStateModel {
  return {
    phase: 'idle', micOn: true, userSpeaking: false,
    activeSeq: null, nextSeq: 1,
    pendingFace: null, pendingTurns: 0,
    idleGreet: 0, idleGreetMax: 2,
    detector: false, avatarPhase: 'idle', avatarBusy: 0,
    timers: {
      watchdog: null, interruptFlush: null, interruptExpire: null,
      pendingDone: null, signalGatingFallback: null, cooldown: null,
    },
    lastTx: null, seqDrops: 0, rows: [], nextRowId: 1,
  };
}

const s = (d: TimingDetail | undefined, k: string, dflt = ''): string => {
  const v = d?.[k];
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : dflt;
};
const n = (d: TimingDetail | undefined, k: string): number | null => {
  const v = d?.[k];
  return typeof v === 'number' ? v : null;
};
const b = (d: TimingDetail | undefined, k: string, dflt: boolean): boolean => {
  const v = d?.[k];
  return typeof v === 'boolean' ? v : dflt;
};

const seqTag = (v: number | null): string => (v == null ? '#?' : `#${v}`);

export function clipText(t: string, max = 10): string {
  if (!t) return '';
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function pushRow(
  m: CallStateModel, text: string, tone: RowTone, indent: boolean, tMs: number,
): CallStateModel {
  const prev = m.rows.length > 0 ? m.rows[m.rows.length - 1] : null;
  const delta = prev ? Math.max(0, tMs - prev.tMs) : 0;
  const line = prev ? `${text} +${delta}` : text;
  const rows = m.rows.concat([{ id: m.nextRowId, text: line, tone, indent, tMs }]);
  return {
    ...m,
    rows: rows.length > MAX_ROWS ? rows.slice(rows.length - MAX_ROWS) : rows,
    nextRowId: m.nextRowId + 1,
  };
}

export function foldTimingEvent(m: CallStateModel, ev: TimingEvent, nowMs: number): CallStateModel {
  const d = ev.detail;
  switch (ev.type) {
    case 'fsm': {
      const from = s(d, 'from');
      const to = s(d, 'to');
      const evName = s(d, 'ev');
      const effects = s(d, 'effects');
      let next: CallStateModel = {
        ...m,
        phase: to || m.phase,
        micOn: b(d, 'micOn', m.micOn),
        userSpeaking: b(d, 'spk', m.userSpeaking),
        activeSeq: 'aseq' in (d ?? {}) ? n(d, 'aseq') : m.activeSeq,
        nextSeq: n(d, 'nseq') ?? m.nextSeq,
        pendingFace: typeof d?.pi === 'string' ? d.pi : null,
        pendingTurns: n(d, 'pit') ?? 0,
        idleGreet: n(d, 'greet') ?? m.idleGreet,
        idleGreetMax: n(d, 'gmax') ?? m.idleGreetMax,
      };

      for (const e of effects.split('|')) {
        if (e === 'START_DETECTOR') next = { ...next, detector: true };
        else if (e === 'STOP_DETECTOR') next = { ...next, detector: false };
      }
      const pseq = n(d, 'pseq');
      if (evName === 'RESPONSE_DONE' || evName === 'RESPONSE_END') {
        const tail = evName === 'RESPONSE_END' ? 'end' : 'done';
        next = pushRow(next, `⇒DONE${seqTag(pseq)}(${tail})→${to}`, 'done', true, ev.tMs);
        if (next.lastTx && next.lastTx.seq === pseq && next.lastTx.doneMs == null) {
          next = { ...next, lastTx: { ...next.lastTx, doneMs: ev.tMs - next.lastTx.tMs } };
        }
      } else if (from !== to) {
        next = pushRow(next, `·${from}→${to}(${evName})`, 'dim', false, ev.tMs);
      }
      return next;
    }

    case 'tx': {
      const seq = n(d, 'seq');
      const mode = s(d, 'mode', '?');
      const text = clipText(s(d, 'text'));
      const withText = text ? ` "${text}"` : '';
      const next = pushRow(m, `→${mode}${seqTag(seq)}${withText}`, mode === 'skip' ? 'warn' : 'tx', false, ev.tMs);
      return { ...next, lastTx: { seq, mode, tMs: ev.tMs, startMs: null, endMs: null, doneMs: null } };
    }

    case 'rx': {
      const sig = s(d, 'sig');
      const seq = n(d, 'seq');
      const srv = n(d, 'srvSeq');
      const srvTag = srv != null && srv !== seq ? `/s${srv}` : '';
      const short = sig === 'speech_start' ? 'start' : sig === 'speech_end' ? 'end' : 'text';
      const rem = n(d, 'remainingMs');
      const remTag = sig === 'speech_end' && rem != null && rem > 0 ? ` rem:${rem}` : '';
      let next = pushRow(m, ` ←${short}${seqTag(seq)}${srvTag}${remTag}`, 'rx', true, ev.tMs);
      if (next.lastTx && next.lastTx.seq === seq) {
        const took = ev.tMs - next.lastTx.tMs;
        if (sig === 'speech_start' && next.lastTx.startMs == null) {
          next = { ...next, lastTx: { ...next.lastTx, startMs: took } };
        } else if (sig === 'speech_end' && next.lastTx.endMs == null) {
          next = { ...next, lastTx: { ...next.lastTx, endMs: took } };
        }
      }
      return next;
    }

    case 'seq_drop': {
      const sig = s(d, 'sig');
      const short = sig === 'speech_start' ? 'start' : sig === 'speech_end' ? 'end' : sig;
      const next = pushRow(
        m, ` ✗drop ${short}#${s(d, 'got', '?')}(want:${s(d, 'want', '?')})`, 'warn', true, ev.tMs);
      return { ...next, seqDrops: next.seqDrops + 1 };
    }

    case 'timer': {
      const rawName = s(d, 'name');
      if (!(TIMER_NAMES as readonly string[]).includes(rawName)) return m;
      const name = rawName as TimerName;
      const action = s(d, 'action');
      const ms = n(d, 'ms') ?? 0;
      const timers = { ...m.timers };
      if (action === 'set') timers[name] = nowMs + ms;
      else timers[name] = null;
      const next: CallStateModel = { ...m, timers };

      if (action !== 'fire') return next;
      const by = s(d, 'by');
      return pushRow(next, `⏰${TIMER_LABEL[name]} fired${by ? `(${by})` : ''}`, 'info', false, ev.tMs);
    }

    case 'avatar': {
      const act = s(d, 'act');
      const phase = s(d, 'phase', m.avatarPhase);
      if (act === 'busy_throw') {
        const next = pushRow(m, `✗avatar busy(${phase})`, 'warn', false, ev.tMs);
        return { ...next, avatarBusy: next.avatarBusy + 1 };
      }
      return { ...m, avatarPhase: phase };
    }

    case 'interrupt': {
      const act = s(d, 'act');
      const face = s(d, 'faceKey');
      const turns = n(d, 'deferredTurns') ?? 0;
      const tone: RowTone =
        act === 'expired' || act === 'dropped_2turns' || act === 'cooldown_block' ? 'warn' : 'info';
      return pushRow(m, `⚑${act}${face ? ` ${face}` : ''}${turns ? `(d${turns})` : ''}`, tone, false, ev.tMs);
    }

    default:

      return m;
  }
}

export function foldAll(m: CallStateModel, evs: TimingEvent[], nowMs: number): CallStateModel {
  return evs.reduce((acc, e) => foldTimingEvent(acc, e, nowMs), m);
}

export function formatRemain(deadlineMs: number | null, nowMs: number): string {
  if (deadlineMs == null) return '—';
  const left = deadlineMs - nowMs;
  if (left <= 0) return '0.0s';
  return `${(left / 1000).toFixed(1)}s`;
}

export function formatStateLines(m: CallStateModel, nowMs: number): string[] {
  const t = m.timers;
  const tx = m.lastTx;
  const ms = (v: number | null) => (v == null ? '—' : `${v}`);
  return [
    `FSM  ${m.phase}`,
    `     mic:${m.micOn ? 'ON' : 'OFF'} spk:${m.userSpeaking ? 'Y' : '-'} det:${m.detector ? 'on' : 'off'}`,
    `seq  act:${m.activeSeq ?? '—'} nxt:${m.nextSeq} drop:${m.seqDrops}`,
    `pend intr:${m.pendingFace ?? '—'}${m.pendingFace ? `(d${m.pendingTurns})` : ''} greet:${m.idleGreet}/${m.idleGreetMax}`,
    `tmr  wd:${formatRemain(t.watchdog, nowMs)} fl:${formatRemain(t.interruptFlush, nowMs)} ex:${formatRemain(t.interruptExpire, nowMs)}`,
    `tmr  pd:${formatRemain(t.pendingDone, nowMs)} sg:${formatRemain(t.signalGatingFallback, nowMs)} cd:${formatRemain(t.cooldown, nowMs)}`,
    `avt  ${m.avatarPhase}${m.avatarBusy ? ` busy:${m.avatarBusy}` : ''}`,
    tx
      ? `io   tx${seqTag(tx.seq)} ${tx.mode} s:${ms(tx.startMs)} e:${ms(tx.endMs)} d:${ms(tx.doneMs)}`
      : 'io   tx:—',
  ];
}
