

export type TimingEventType =
  | 'speech_start' | 'speech_end'
  | 'stt_open' | 'stt_close'
  | 'suppress_on' | 'suppress_off'
  | 'vad_endpoint' | 'dev_listen_now'

  | 'fsm'        
  | 'tx'         
  | 'rx'         
  | 'seq_drop'   
  | 'timer'      
  | 'avatar'     
  | 'interrupt'; 

export type TimingDetail = Record<string, string | number | boolean | null>;

export interface TimingEvent { type: TimingEventType; tMs: number; detail?: TimingDetail }

const MAX = 40;
let buffer: TimingEvent[] = [];
let subs: Array<(events: TimingEvent[]) => void> = [];
let clock: () => number = () => Date.now();

export function __setTimingClock(fn: () => number): void { clock = fn; }

const SUB_ERR_LOG_MAX = 5;
let subErrCount = 0;

function notify(): void {
  const snapshot = buffer.slice();

  for (const cb of subs.slice()) safeCall(cb, snapshot);
}

function safeCall(cb: (events: TimingEvent[]) => void, snapshot: TimingEvent[]): void {
  try {
    cb(snapshot);
  } catch (e) {
    if (!__DEV__) return;
    subErrCount += 1;
    if (subErrCount > SUB_ERR_LOG_MAX) return;

    console.log(
      '[Call][timing][subscriber-error]', String(e),
      subErrCount === SUB_ERR_LOG_MAX ? '(이후 동일 로그 억제)' : '',
    );
  }
}

export function emitTimingEvent(type: TimingEventType, detail?: TimingDetail): void {
  if (!__DEV__) return; 
  buffer.push(detail === undefined ? { type, tMs: clock() } : { type, tMs: clock(), detail });
  if (buffer.length > MAX) buffer = buffer.slice(buffer.length - MAX);
  notify();
}

export function subscribeTimingEvents(cb: (events: TimingEvent[]) => void): () => void {
  subs.push(cb);
  safeCall(cb, buffer.slice()); 
  return () => { subs = subs.filter((s) => s !== cb); };
}

export function getTimingEvents(): TimingEvent[] { return buffer.slice(); }
export function clearTimingEvents(): void { buffer = []; subErrCount = 0; notify(); }

export function formatTimingLine(ev: TimingEvent, prev: TimingEvent | null): string {
  const delta = prev ? ev.tMs - prev.tMs : 0;
  return `${ev.type.padEnd(14)}+${delta}ms`;
}
