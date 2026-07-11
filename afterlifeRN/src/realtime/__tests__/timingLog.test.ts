import { v_1b1534 } from '../timingLog';
import { v_d7f7b1, v_8c24f4, v_94a663 } from '../timingEvents';

describe('timingLog', () => {
  beforeEach(() => { v_94a663(() => 0); v_8c24f4(); });

  it('logs only newly emitted events with [Call][timing] prefix', () => {
    const v_980ff2 = jest.spyOn(console, 'log').mockImplementation(() => {});
    const v_3e54f8 = v_1b1534();      
    v_d7f7b1('stt_open');
    const v_78de17 = v_980ff2.mock.calls.filter((v_3f4e2e) => v_3f4e2e[0] === '[Call][timing]');
    expect(v_78de17.length).toBe(1);
    expect(v_78de17[0]).toContain('stt_open');
    v_3e54f8();
    v_d7f7b1('stt_close');
    const v_33efc5 = v_980ff2.mock.calls.filter((v_3f4e2e) => v_3f4e2e[0] === '[Call][timing]');
    expect(v_33efc5.length).toBe(1);       
    v_980ff2.mockRestore();
  });

  it('does NOT log the pre-existing buffer on subscribe (Critical regression)', () => {
    const v_980ff2 = jest.spyOn(console, 'log').mockImplementation(() => {});
    v_d7f7b1('speech_start');
    v_d7f7b1('speech_end');
    const v_3e54f8 = v_1b1534(); 
    const v_1f978f = v_980ff2.mock.calls.filter((v_3f4e2e) => v_3f4e2e[0] === '[Call][timing]');
    expect(v_1f978f.length).toBe(0); 

    v_d7f7b1('stt_open'); 
    const v_78de17 = v_980ff2.mock.calls.filter((v_3f4e2e) => v_3f4e2e[0] === '[Call][timing]');
    expect(v_78de17.length).toBe(1);
    expect(v_78de17[0]).toContain('stt_open');

    v_3e54f8();
    v_980ff2.mockRestore();
  });

  it('keeps logging past the 40-event ring-buffer cap (no permanent stop)', () => {
    const v_980ff2 = jest.spyOn(console, 'log').mockImplementation(() => {});
    let v_8d41d7 = 0;
    v_94a663(() => v_8d41d7);
    const v_3e54f8 = v_1b1534();

    for (let v_ebec57 = 0; v_ebec57 < 45; v_ebec57++) {
      v_8d41d7 = v_ebec57;
      v_d7f7b1('vad_endpoint');
    }

    const v_78de17 = v_980ff2.mock.calls.filter((v_3f4e2e) => v_3f4e2e[0] === '[Call][timing]');
    expect(v_78de17.length).toBe(45); 
    const v_506e86 = v_78de17[v_78de17.length - 1];
    expect(v_506e86[3]).toBe(44); 

    v_3e54f8();
    v_980ff2.mockRestore();
  });

  it('is a no-op when __DEV__ is false (no subscription created, no logs)', () => {
    const v_980ff2 = jest.spyOn(console, 'log').mockImplementation(() => {});
    const v_59a4a1 = (global as any).__DEV__;
    (global as any).__DEV__ = false;
    const v_3e54f8 = v_1b1534();
    (global as any).__DEV__ = v_59a4a1; 

    v_d7f7b1('stt_open');
    const v_78de17 = v_980ff2.mock.calls.filter((v_3f4e2e) => v_3f4e2e[0] === '[Call][timing]');
    expect(v_78de17.length).toBe(0); 

    v_3e54f8(); 
    v_980ff2.mockRestore();
  });
});
