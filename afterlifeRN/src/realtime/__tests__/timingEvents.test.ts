import {
  emitTimingEvent, subscribeTimingEvents, getTimingEvents,
  clearTimingEvents, formatTimingLine, __setTimingClock,
} from '../timingEvents';

describe('timingEvents', () => {
  let t = 0;
  beforeEach(() => {
    t = 0;
    __setTimingClock(() => t);
    clearTimingEvents();
  });

  it('emit records events with monotonic time (dev)', () => {
    t = 100; emitTimingEvent('speech_start');
    t = 250; emitTimingEvent('speech_end');
    const evs = getTimingEvents();
    expect(evs.map((e) => e.type)).toEqual(['speech_start', 'speech_end']);
    expect(evs[1].tMs).toBe(250);
  });

  it('subscribe fires immediately then on each emit', () => {
    const calls: number[] = [];
    const unsub = subscribeTimingEvents((evs) => calls.push(evs.length));
    expect(calls).toEqual([0]);          
    emitTimingEvent('stt_open');
    expect(calls).toEqual([0, 1]);
    unsub();
    emitTimingEvent('stt_close');
    expect(calls).toEqual([0, 1]);        
  });

  it('ring buffer caps at 40 events (drops oldest)', () => {
    for (let i = 0; i < 45; i++) { t = i; emitTimingEvent('vad_endpoint'); }
    const evs = getTimingEvents();
    expect(evs.length).toBe(40);
    expect(evs[0].tMs).toBe(5);           
    expect(evs[evs.length - 1].tMs).toBe(44);
  });

  it('formatTimingLine shows delta from prev', () => {
    const a = { type: 'speech_end' as const, tMs: 1000 };
    const b = { type: 'stt_open' as const, tMs: 2620 };
    expect(formatTimingLine(a, null)).toContain('+0ms');
    expect(formatTimingLine(b, a)).toContain('+1620ms');
    expect(formatTimingLine(b, a)).toContain('stt_open');
  });
});
