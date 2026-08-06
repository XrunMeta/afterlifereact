

import { renderHook, act } from '@testing-library/react-native';
import { useHandsFreeController } from '../useHandsFreeController';
import { useTimingConfigStore, TIMING_DEFAULTS } from '../timingConfig';
import { getTimingEvents, clearTimingEvents } from '../timingEvents';

function makeEngine() {
  const listeners: Record<string, (p: any) => void> = {};
  return {
    engine: {
      requestPermissionsAsync: async () => ({ granted: true }),
      start: jest.fn(),
      stop: jest.fn(),
      addListener: (ev: string, cb: (p: any) => void) => { listeners[ev] = cb; return { remove: () => {} }; },
    },
    fire: (ev: string, p?: any) => act(() => { listeners[ev]?.(p); }),
  };
}

const _queueCache = new Map<object, any[]>();
let _queueId = 0;
const toQueue = (sig: any): any[] | undefined => {
  if (!sig) return undefined;
  let q = _queueCache.get(sig);
  if (!q) { _queueId += 1; q = [{ ...sig, id: _queueId }]; _queueCache.set(sig, q); }
  return q;
};

const baseOpts = (engine: any) => ({
  enabled: true,
  say: jest.fn(async () => {}),
  getStatsReport: () => null,
  notifySpeechEnd: jest.fn(),
  speechEngine: engine,
});

describe('useHandsFreeController timing wiring', () => {
  beforeEach(() => { useTimingConfigStore.setState({ ...TIMING_DEFAULTS }); clearTimingEvents(); });

  it('exposes devForceListen and emits dev_listen_now + stt_open', async () => {
    const { engine } = makeEngine();
    const { result } = renderHook(() => useHandsFreeController(baseOpts(engine)));

    await act(async () => { result.current.devForceListen(); });
    const types = getTimingEvents().map((e) => e.type);
    expect(types).toContain('dev_listen_now');
    expect(types).toContain('stt_open');
    expect(engine.start).toHaveBeenCalled();
  });

  it('emits speech_start/speech_end from signals', () => {
    const { engine } = makeEngine();
    const { rerender } = renderHook(
      (props: any) => useHandsFreeController({ ...baseOpts(engine), signals: toQueue(props.sig) }),
      { initialProps: { sig: null as any } },
    );
    rerender({ sig: { type: 'speech_start', ts: 1 } });
    rerender({ sig: { type: 'speech_end', ts: 2 } });
    const types = getTimingEvents().map((e) => e.type);
    expect(types).toContain('speech_start');
    expect(types).toContain('speech_end');
  });
});
