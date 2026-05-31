import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSpeechInput } from '../../src/realtime/useSpeechInput';

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

it('권한 허용 → start → result 이벤트(isFinal=true) → transcript 반환', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine }));
  await act(async () => {
    await result.current.startListening();
  });
  expect(engine.start).toHaveBeenCalled();
  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });
  await waitFor(() => expect(result.current.transcript).toBe('안녕하세요'));
});

it('권한 거부 → error, start 미호출', async () => {
  const engine = makeMockEngine();
  engine.requestPermissionsAsync.mockResolvedValue({ granted: false });
  const { result } = renderHook(() => useSpeechInput({ engine }));
  await act(async () => {
    await result.current.startListening();
  });
  expect(engine.start).not.toHaveBeenCalled();
  expect(result.current.error).toBeTruthy();
});

it('stopListening → engine.stop', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    result.current.stopListening();
  });
  expect(engine.stop).toHaveBeenCalled();
});

it('interim 여러 번 → isFinal=true 에서만 onFinalResult 1회 호출(최종 텍스트)', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {

    engine.emit('result', { results: [{ transcript: '안' }], isFinal: false });
    engine.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });
  expect(onFinalResult).not.toHaveBeenCalled();

  await waitFor(() => expect(result.current.interimTranscript).toBe('안녕'));
  act(() => {

    engine.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });
  await waitFor(() => expect(result.current.transcript).toBe('안녕하세요'));
  expect(onFinalResult).toHaveBeenCalledTimes(1);
  expect(onFinalResult).toHaveBeenCalledWith('안녕하세요');
});

it('공백만인 final → onFinalResult 미호출', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '   ' }], isFinal: true });
  });
  await waitFor(() => expect(result.current.transcript).toBe('   '));
  expect(onFinalResult).not.toHaveBeenCalled();
});
