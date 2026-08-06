

import type { v_57432e, v_c56f36 } from './timingEvents';

export type TimerName =
  | 'watchdog' | 'interruptFlush' | 'interruptExpire'
  | 'pendingDone' | 'signalGatingFallback' | 'cooldown';

export const v_fb5ae7 = [
  'watchdog', 'interruptFlush', 'interruptExpire', 'pendingDone', 'signalGatingFallback', 'cooldown',
];

export const v_a02526 = {
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

const v_a72801 = 200;

export function v_f983f2(): CallStateModel {
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

const v_fd5f43 = (d: v_57432e | undefined, v_0eb677, v_f03c93 = ''): string => {
  const v_81e2ef = v_d5dda0?.[v_0eb677];
  return typeof v_81e2ef === 'string' ? v_81e2ef : typeof v_81e2ef === 'number' ? String(v_81e2ef) : v_f03c93;
};
const v_f4e98d = (d: v_57432e | undefined, v_0eb677): number | null => {
  const v_81e2ef = v_d5dda0?.[v_0eb677];
  return typeof v_81e2ef === 'number' ? v_81e2ef : null;
};
const v_148ff6 = (d: v_57432e | undefined, v_0eb677, v_f03c93): boolean => {
  const v_81e2ef = v_d5dda0?.[v_0eb677];
  return typeof v_81e2ef === 'boolean' ? v_81e2ef : v_f03c93;
};

const v_9e7223 = (v_81e2ef): string => (v_81e2ef == null ? '#?' : `#${v_81e2ef}`);

export function v_368fda(v_8d41d7, v_d2c6bf = 10): string {
  if (!v_8d41d7) return '';
  return v_8d41d7.length <= v_d2c6bf ? v_8d41d7 : `${v_8d41d7.slice(0, v_d2c6bf)}…`;
}

export const v_878e2e = (v_779914, v_148ff6): boolean =>
  v_779914 != null && v_148ff6 != null && v_779914 === v_148ff6;

function v_a64334(
  v_35f85c, v_9b6134, v_20ef8e, v_45fb16, v_17bb72,
): CallStateModel {
  const v_ba2215 = v_35f85c.rows.length > 0 ? v_35f85c.rows[v_35f85c.rows.length - 1] : null;
  const v_e9396c = v_ba2215 ? Math.max(0, v_17bb72 - v_ba2215.tMs) : 0;
  const v_e6293e = v_ba2215 ? `${v_9b6134} +${v_e9396c}` : v_9b6134;
  const v_18b8bf = v_35f85c.rows.concat([{ id: v_35f85c.nextRowId, text: v_e6293e, tone: v_20ef8e, indent: v_45fb16, tMs: v_17bb72 }]);
  return {
    ...v_35f85c,
    rows: v_18b8bf.length > v_a72801 ? v_18b8bf.slice(v_18b8bf.length - v_a72801) : v_18b8bf,
    nextRowId: v_35f85c.nextRowId + 1,
  };
}

export function v_fe1d77(v_35f85c, ev: v_c56f36, v_67e77e): CallStateModel {
  const v_d5dda0 = v_1d299c.detail;
  switch (v_1d299c.type) {
    case 'fsm': {
      const v_a13c2e = v_fd5f43(v_d5dda0, 'from');
      const v_257132 = v_fd5f43(v_d5dda0, 'to');
      const v_b2b35d = v_fd5f43(v_d5dda0, 'ev');
      const v_27ef63 = v_fd5f43(v_d5dda0, 'effects');
      let v_a448ad = {
        ...v_35f85c,
        phase: v_257132 || v_35f85c.phase,
        micOn: v_148ff6(v_d5dda0, 'micOn', v_35f85c.micOn),
        userSpeaking: v_148ff6(v_d5dda0, 'spk', v_35f85c.userSpeaking),
        activeSeq: 'aseq' in (v_d5dda0 ?? {}) ? v_f4e98d(v_d5dda0, 'aseq') : v_35f85c.activeSeq,
        nextSeq: v_f4e98d(v_d5dda0, 'nseq') ?? v_35f85c.nextSeq,
        pendingFace: typeof v_d5dda0?.pi === 'string' ? v_d5dda0.pi : null,
        pendingTurns: v_f4e98d(v_d5dda0, 'pit') ?? 0,
        idleGreet: v_f4e98d(v_d5dda0, 'greet') ?? v_35f85c.idleGreet,
        idleGreetMax: v_f4e98d(v_d5dda0, 'gmax') ?? v_35f85c.idleGreetMax,
      };

      for (const v_9e86fd of v_27ef63.split('|')) {
        if (v_9e86fd === 'START_DETECTOR') v_a448ad = { ...v_a448ad, detector: true };
        else if (v_9e86fd === 'STOP_DETECTOR') v_a448ad = { ...v_a448ad, detector: false };
      }
      const v_c4b8f0 = v_f4e98d(v_d5dda0, 'pseq');
      if (v_b2b35d === 'RESPONSE_DONE' || v_b2b35d === 'RESPONSE_END') {
        const v_25c4f7 = v_b2b35d === 'RESPONSE_END' ? 'end' : 'done';
        v_a448ad = v_a64334(v_a448ad, `⇒DONE${v_9e7223(v_c4b8f0)}(${v_25c4f7})→${v_257132}`, 'done', true, v_1d299c.tMs);
        if (v_a448ad.lastTx && v_878e2e(v_a448ad.lastTx.seq, v_c4b8f0) && v_a448ad.lastTx.doneMs == null) {
          v_a448ad = { ...v_a448ad, lastTx: { ...v_a448ad.lastTx, doneMs: v_1d299c.tMs - v_a448ad.lastTx.tMs } };
        }
      } else if (v_a13c2e !== v_257132) {
        v_a448ad = v_a64334(v_a448ad, `·${v_a13c2e}→${v_257132}(${v_b2b35d})`, 'dim', false, v_1d299c.tMs);
      }
      return v_a448ad;
    }

    case 'tx': {
      const v_1923e2 = v_f4e98d(v_d5dda0, 'seq');
      const v_34e5bb = v_fd5f43(v_d5dda0, 'mode', '?');
      const v_9b6134 = v_368fda(v_fd5f43(v_d5dda0, 'text'));
      const v_ba717d = v_9b6134 ? ` "${v_9b6134}"` : '';
      const v_a448ad = v_a64334(v_35f85c, `→${v_34e5bb}${v_9e7223(v_1923e2)}${v_ba717d}`, v_34e5bb === 'skip' ? 'warn' : 'tx', false, v_1d299c.tMs);
      return { ...v_a448ad, lastTx: { seq: v_1923e2, mode: v_34e5bb, tMs: v_1d299c.tMs, startMs: null, endMs: null, doneMs: null } };
    }

    case 'rx': {
      const v_f2c979 = v_fd5f43(v_d5dda0, 'sig');
      const v_1923e2 = v_f4e98d(v_d5dda0, 'seq');
      const v_9bdcf4 = v_f4e98d(v_d5dda0, 'srvSeq');
      const v_004bac = v_9bdcf4 != null && v_9bdcf4 !== v_1923e2 ? `/s${v_9bdcf4}` : '';
      const v_c0d7a5 = v_f2c979 === 'speech_start' ? 'start' : v_f2c979 === 'speech_end' ? 'end' : 'text';
      const v_3300b9 = v_f4e98d(v_d5dda0, 'remainingMs');
      const v_0314d4 = v_f2c979 === 'speech_end' && v_3300b9 != null && v_3300b9 > 0 ? ` rem:${v_3300b9}` : '';
      let v_a448ad = v_a64334(v_35f85c, ` ←${v_c0d7a5}${v_9e7223(v_1923e2)}${v_004bac}${v_0314d4}`, 'rx', true, v_1d299c.tMs);
      if (v_a448ad.lastTx && v_878e2e(v_a448ad.lastTx.seq, v_1923e2)) {
        const v_1fe6ad = v_1d299c.tMs - v_a448ad.lastTx.tMs;
        if (v_f2c979 === 'speech_start' && v_a448ad.lastTx.startMs == null) {
          v_a448ad = { ...v_a448ad, lastTx: { ...v_a448ad.lastTx, startMs: v_1fe6ad } };
        } else if (v_f2c979 === 'speech_end' && v_a448ad.lastTx.endMs == null) {
          v_a448ad = { ...v_a448ad, lastTx: { ...v_a448ad.lastTx, endMs: v_1fe6ad } };
        }
      }
      return v_a448ad;
    }

    case 'seq_drop': {
      const v_f2c979 = v_fd5f43(v_d5dda0, 'sig');
      const v_c0d7a5 = v_f2c979 === 'speech_start' ? 'start' : v_f2c979 === 'speech_end' ? 'end' : v_f2c979;
      const v_a448ad = v_a64334(
        v_35f85c, ` ✗drop ${v_c0d7a5}#${v_fd5f43(v_d5dda0, 'got', '?')}(want:${v_fd5f43(v_d5dda0, 'want', '?')})`, 'warn', true, v_1d299c.tMs);
      return { ...v_a448ad, seqDrops: v_a448ad.seqDrops + 1 };
    }

    case 'timer': {
      const v_162c49 = v_fd5f43(v_d5dda0, 'name');
      if (!(v_fb5ae7 as readonly string[]).includes(v_162c49)) return v_35f85c;
      const v_1833e7 = v_162c49 as TimerName;
      const v_9b064f = v_fd5f43(v_d5dda0, 'action');
      const v_d799e2 = v_f4e98d(v_d5dda0, 'ms') ?? 0;
      const v_1d8e94 = { ...v_35f85c.timers };
      if (v_9b064f === 'set') v_1d8e94[v_1833e7] = v_67e77e + v_d799e2;
      else v_1d8e94[v_1833e7] = null;
      const v_a448ad = { ...v_35f85c, timers: v_1d8e94 };

      if (v_9b064f !== 'fire') return v_a448ad;
      const v_0c42b9 = v_fd5f43(v_d5dda0, 'by');
      return v_a64334(v_a448ad, `⏰${v_a02526[v_1833e7]} fired${v_0c42b9 ? `(${v_0c42b9})` : ''}`, 'info', false, v_1d299c.tMs);
    }

    case 'avatar': {
      const v_be73a0 = v_fd5f43(v_d5dda0, 'act');
      const v_ab4803 = v_fd5f43(v_d5dda0, 'phase', v_35f85c.avatarPhase);
      if (v_be73a0 === 'busy_throw') {
        const v_a448ad = v_a64334(v_35f85c, `✗avatar busy(${v_ab4803})`, 'warn', false, v_1d299c.tMs);
        return { ...v_a448ad, avatarBusy: v_a448ad.avatarBusy + 1 };
      }
      return { ...v_35f85c, avatarPhase: v_ab4803 };
    }

    case 'interrupt': {
      const v_be73a0 = v_fd5f43(v_d5dda0, 'act');
      const v_7d769d = v_fd5f43(v_d5dda0, 'faceKey');
      const v_3035d9 = v_f4e98d(v_d5dda0, 'deferredTurns') ?? 0;
      const v_20ef8e =
        v_be73a0 === 'expired' || v_be73a0 === 'dropped_2turns' || v_be73a0 === 'cooldown_block' ? 'warn' : 'info';
      return v_a64334(v_35f85c, `⚑${v_be73a0}${v_7d769d ? ` ${v_7d769d}` : ''}${v_3035d9 ? `(d${v_3035d9})` : ''}`, v_20ef8e, false, v_1d299c.tMs);
    }

    default:

      return v_35f85c;
  }
}

export function v_2aa637(v_35f85c, evs: v_c56f36[], v_67e77e): CallStateModel {
  return v_7866ae.reduce((v_9f1d92, v_9e86fd) => v_fe1d77(v_9f1d92, v_9e86fd, v_67e77e), v_35f85c);
}

export function v_b952e6(v_8d9895, v_67e77e): string {
  if (v_8d9895 == null) return '—';
  const v_dbaa7f = v_8d9895 - v_67e77e;
  if (v_dbaa7f <= 0) return '0.0s';
  return `${(v_dbaa7f / 1000).toFixed(1)}s`;
}

export function v_cfefae(v_35f85c, v_67e77e): string[] {
  const v_8d41d7 = v_35f85c.timers;
  const v_2f6fcc = v_35f85c.lastTx;
  const v_d799e2 = (v_81e2ef) => (v_81e2ef == null ? '—' : `${v_81e2ef}`);
  return [
    `FSM  ${v_35f85c.phase}`,
    `     mic:${v_35f85c.micOn ? 'ON' : 'OFF'} spk:${v_35f85c.userSpeaking ? 'Y' : '-'} det:${v_35f85c.detector ? 'on' : 'off'}`,
    `seq  act:${v_35f85c.activeSeq ?? '—'} nxt:${v_35f85c.nextSeq} drop:${v_35f85c.seqDrops}`,
    `pend intr:${v_35f85c.pendingFace ?? '—'}${v_35f85c.pendingFace ? `(d${v_35f85c.pendingTurns})` : ''} greet:${v_35f85c.idleGreet}/${v_35f85c.idleGreetMax}`,
    `tmr  wd:${v_b952e6(v_8d41d7.watchdog, v_67e77e)} fl:${v_b952e6(v_8d41d7.interruptFlush, v_67e77e)} ex:${v_b952e6(v_8d41d7.interruptExpire, v_67e77e)}`,
    `tmr  pd:${v_b952e6(v_8d41d7.pendingDone, v_67e77e)} sg:${v_b952e6(v_8d41d7.signalGatingFallback, v_67e77e)} cd:${v_b952e6(v_8d41d7.cooldown, v_67e77e)}`,
    `avt  ${v_35f85c.avatarPhase}${v_35f85c.avatarBusy ? ` busy:${v_35f85c.avatarBusy}` : ''}`,
    v_2f6fcc
      ? `io   tx${v_9e7223(v_2f6fcc.seq)} ${v_2f6fcc.mode} s:${v_d799e2(v_2f6fcc.startMs)} e:${v_d799e2(v_2f6fcc.endMs)} d:${v_d799e2(v_2f6fcc.doneMs)}`
      : 'io   tx:—',
  ];
}
