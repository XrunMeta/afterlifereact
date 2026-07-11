

export type TimingEventType =
  | 'speech_start' | 'speech_end'
  | 'stt_open' | 'stt_close'
  | 'suppress_on' | 'suppress_off'
  | 'vad_endpoint' | 'dev_listen_now';

export interface TimingEvent { type: TimingEventType; tMs: number }

const MAX = 40;
let buffer: TimingEvent[] = [];
let subs: Array<(events: TimingEvent[]) => void> = [];
let clock: () => number = () => Date.now();

export function __setTimingClock(fn: () => number): void { clock = fn; }

function notify(): void {
  const snapshot = buffer.slice();
  subs.forEach((cb) => cb(snapshot));
}

export function emitTimingEvent(type: TimingEventType): void {
  if (!__DEV__) return; 
  buffer.push({ type, tMs: clock() });
  if (buffer.length > MAX) buffer = buffer.slice(buffer.length - MAX);
  notify();
}

export function subscribeTimingEvents(cb: (events: TimingEvent[]) => void): () => void {
  subs.push(cb);
  cb(buffer.slice()); 
  return () => { subs = subs.filter((s) => s !== cb); };
}

export function getTimingEvents(): TimingEvent[] { return buffer.slice(); }
export function clearTimingEvents(): void { buffer = []; notify(); }

export function formatTimingLine(ev: TimingEvent, prev: TimingEvent | null): string {
  const delta = prev ? ev.tMs - prev.tMs : 0;
  return `${ev.type.padEnd(14)}+${delta}ms`;
}
