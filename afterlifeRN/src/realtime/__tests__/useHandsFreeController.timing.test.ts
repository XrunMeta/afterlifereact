

import { v_0da18b, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_7df8a4 } from '../useHandsFreeController';
import { v_7347b3, v_183224 } from '../timingConfig';
import { v_08004c, v_8c24f4 } from '../timingEvents';

function v_7b2a3a() {
  const v_9fde29 = {};
  return {
    engine: {
      requestPermissionsAsync: async () => ({ granted: true }),
      start: jest.fn(),
      stop: jest.fn(),
      addListener: (v_1d299c, v_16dbdb) => { v_9fde29[v_1d299c] = v_16dbdb; return { remove: () => {} }; },
    },
    fire: (v_1d299c, v_e2a85c) => v_be73a0(() => { v_9fde29[v_1d299c]?.(v_e2a85c); }),
  };
}

const v_1b295e = new Map<object, any[]>();
let v_676568 = 0;
const v_fb593a = (v_f2c979): any[] | undefined => {
  if (!v_f2c979) return undefined;
  let v_ab6401 = v_1b295e.get(v_f2c979);
  if (!v_ab6401) { v_676568 += 1; v_ab6401 = [{ ...v_f2c979, id: v_676568 }]; v_1b295e.set(v_f2c979, v_ab6401); }
  return v_ab6401;
};

const v_b2d8b4 = (v_1e3df0) => ({
  enabled: true,
  say: jest.fn(async () => {}),
  getStatsReport: () => null,
  notifySpeechEnd: jest.fn(),
  speechEngine: v_1e3df0,
});

describe('useHandsFreeController timing wiring', () => {
  beforeEach(() => { v_7347b3.setState({ ...v_183224 }); v_8c24f4(); });

  it('exposes devForceListen and emits dev_listen_now + stt_open', async () => {
    const { engine: v_1e3df0 } = v_7b2a3a();
    const { result: v_43c42e } = v_0da18b(() => v_7df8a4(v_b2d8b4(v_1e3df0)));

    await v_be73a0(async () => { v_43c42e.current.devForceListen(); });
    const v_db0487 = v_08004c().map((v_9e86fd) => v_9e86fd.type);
    expect(v_db0487).toContain('dev_listen_now');
    expect(v_db0487).toContain('stt_open');
    expect(v_1e3df0.start).toHaveBeenCalled();
  });

  it('emits speech_start/speech_end from signals', () => {
    const { engine: v_1e3df0 } = v_7b2a3a();
    const { rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_7df8a4({ ...v_b2d8b4(v_1e3df0), signals: v_fb593a(v_b1927c.sig) }),
      { initialProps: { sig: null as any } },
    );
    v_2726cb({ sig: { type: 'speech_start', ts: 1 } });
    v_2726cb({ sig: { type: 'speech_end', ts: 2 } });
    const v_db0487 = v_08004c().map((v_9e86fd) => v_9e86fd.type);
    expect(v_db0487).toContain('speech_start');
    expect(v_db0487).toContain('speech_end');
  });
});
