import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHandsFreeController } from '../../src/realtime/useHandsFreeController';

function makeMockEngine() {
  const listeners: Record<string, Array<(p?: any) => void>> = {};
  return {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    start: jest.fn(),
    stop: jest.fn(),
    addListener: (ev: string, cb: (p?: any) => void) => {
      (listeners[ev] ||= []).push(cb);
      return { remove: () => {} };
    },
    emit: (ev: string, p?: any) => (listeners[ev] || []).forEach((cb) => cb(p)),
  };
}

it('enabled=true → STT 시작(listening)', async () => {
  const engine = makeMockEngine();
  const say = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() =>
    useHandsFreeController({
      enabled: true,
      say,
      getStatsReport: () => null,
      notifySpeechEnd: jest.fn(),
      speechEngine: engine,
    }),
  );
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  expect(result.current.phase).toBe('listening');
});

it('STT final → 침묵 debounce 후 say 호출 + speaking 전환', async () => {
  const engine = makeMockEngine();
  const say = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() =>
    useHandsFreeController({
      enabled: true,
      say,
      getStatsReport: () => null,
      notifySpeechEnd: jest.fn(),
      speechEngine: engine,
      silenceMs: 20, 
    }),
  );
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  act(() => { engine.emit('result', { results: [{ transcript: '안녕' }], isFinal: true }); });

  await waitFor(() => expect(say).toHaveBeenCalledWith('안녕'));
  await waitFor(() => expect(result.current.phase).toBe('speaking'));
  expect(engine.stop).toHaveBeenCalled();
});

it('toggleMic: listening → paused(마이크 끔)', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() =>
    useHandsFreeController({
      enabled: true,
      say: jest.fn().mockResolvedValue(undefined),
      getStatsReport: () => null,
      notifySpeechEnd: jest.fn(),
      speechEngine: engine,
    }),
  );
  await waitFor(() => expect(result.current.phase).toBe('listening'));
  act(() => { result.current.toggleMic(); });
  expect(result.current.micOn).toBe(false);
  expect(result.current.phase).toBe('paused');
});
