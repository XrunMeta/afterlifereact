import {
  v_d7f7b1, v_2c6b15, v_08004c,
  v_8c24f4, v_ad545f, v_94a663,
} from '../timingEvents';

describe('timingEvents', () => {
  let v_8d41d7 = 0;
  beforeEach(() => {
    v_8d41d7 = 0;
    v_94a663(() => v_8d41d7);
    v_8c24f4();
  });

  it('emit records events with monotonic time (dev)', () => {
    v_8d41d7 = 100; v_d7f7b1('speech_start');
    v_8d41d7 = 250; v_d7f7b1('speech_end');
    const v_7866ae = v_08004c();
    expect(v_7866ae.map((v_9e86fd) => v_9e86fd.type)).toEqual(['speech_start', 'speech_end']);
    expect(v_7866ae[1].tMs).toBe(250);
  });

  it('subscribe fires immediately then on each emit', () => {
    const v_20e160 = [];
    const v_69c966 = v_2c6b15((v_7866ae) => v_20e160.push(v_7866ae.length));
    expect(v_20e160).toEqual([0]);          
    v_d7f7b1('stt_open');
    expect(v_20e160).toEqual([0, 1]);
    v_69c966();
    v_d7f7b1('stt_close');
    expect(v_20e160).toEqual([0, 1]);        
  });

  it('ring buffer caps at 40 events (drops oldest)', () => {
    for (let v_ebec57 = 0; v_ebec57 < 45; v_ebec57++) { v_8d41d7 = v_ebec57; v_d7f7b1('vad_endpoint'); }
    const v_7866ae = v_08004c();
    expect(v_7866ae.length).toBe(40);
    expect(v_7866ae[0].tMs).toBe(5);           
    expect(v_7866ae[v_7866ae.length - 1].tMs).toBe(44);
  });

  it('subscriber exception is isolated (does not break emitter or other subscribers)', () => {
    const v_980ff2 = jest.spyOn(console, 'log').mockImplementation(() => {});
    const v_110a8b = [];
    const v_302922 = v_2c6b15(() => { throw new Error('boom'); });
    const v_65c284 = v_2c6b15((v_7866ae) => { v_110a8b.push(v_7866ae.length); });

    expect(() => v_d7f7b1('stt_open')).not.toThrow(); 
    expect(v_110a8b[v_110a8b.length - 1]).toBe(1);                   
    expect(v_08004c()).toHaveLength(1);               

    const v_f4cc46 = v_980ff2.mock.calls.filter((v_3f4e2e) => v_3f4e2e[0] === '[Call][timing][subscriber-error]');
    expect(v_f4cc46.length).toBeGreaterThan(0);               
    v_302922(); v_65c284(); v_980ff2.mockRestore();
  });

  it('subscriber exception logging is capped (no infinite log spam)', () => {
    const v_980ff2 = jest.spyOn(console, 'log').mockImplementation(() => {});
    const v_69c966 = v_2c6b15(() => { throw new Error('boom'); });
    for (let v_ebec57 = 0; v_ebec57 < 30; v_ebec57++) v_d7f7b1('stt_open');
    const v_f4cc46 = v_980ff2.mock.calls.filter((v_3f4e2e) => v_3f4e2e[0] === '[Call][timing][subscriber-error]');
    expect(v_f4cc46.length).toBeLessThanOrEqual(5);
    v_69c966(); v_980ff2.mockRestore();
  });

  it('emit accepts an optional detail payload (legacy calls unchanged)', () => {
    v_8d41d7 = 7; v_d7f7b1('stt_open');
    v_8d41d7 = 8; v_d7f7b1('fsm', { from: 'idle', to: 'listening' });
    const v_7866ae = v_08004c();
    expect(v_7866ae[0].detail).toBeUndefined();
    expect(v_7866ae[1].detail).toEqual({ from: 'idle', to: 'listening' });
  });

  it('formatTimingLine shows delta from prev', () => {
    const v_779914 = { type: 'speech_end' as const, tMs: 1000 };
    const v_148ff6 = { type: 'stt_open' as const, tMs: 2620 };
    expect(v_ad545f(v_779914, null)).toContain('+0ms');
    expect(v_ad545f(v_148ff6, v_779914)).toContain('+1620ms');
    expect(v_ad545f(v_148ff6, v_779914)).toContain('stt_open');
  });
});
