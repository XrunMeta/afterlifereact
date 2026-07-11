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

  it('formatTimingLine shows delta from prev', () => {
    const v_779914 = { type: 'speech_end' as const, tMs: 1000 };
    const v_148ff6 = { type: 'stt_open' as const, tMs: 2620 };
    expect(v_ad545f(v_779914, null)).toContain('+0ms');
    expect(v_ad545f(v_148ff6, v_779914)).toContain('+1620ms');
    expect(v_ad545f(v_148ff6, v_779914)).toContain('stt_open');
  });
});
