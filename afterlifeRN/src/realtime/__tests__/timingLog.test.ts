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
});
