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

const SILENCE = 50;

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

it('권한 허용 → start(continuous,interimResults) 호출', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  expect(engine.start).toHaveBeenCalled();
  const opts = engine.start.mock.calls[0][0];
  expect(opts.interimResults).toBe(true);
  expect(opts.continuous).toBe(true);
});

it('권한 거부 → error, start 미호출', async () => {
  const engine = makeMockEngine();
  engine.requestPermissionsAsync.mockResolvedValue({ granted: false });
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  expect(engine.start).not.toHaveBeenCalled();
  expect(result.current.error).toBeTruthy();
});

it('stopListening → engine.stop, 대기 중 debounce 취소(미전송)', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });

  act(() => {
    result.current.stopListening();
  });
  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  expect(engine.stop).toHaveBeenCalled();
  expect(onFinalResult).not.toHaveBeenCalled();
});

it('발화 중 멈칫(침묵<debounce)에 새 result → 타이머 리셋, 미전송', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });

  act(() => {
    jest.advanceTimersByTime(SILENCE - 10);
  });

  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕하세요 반갑습니다' }], isFinal: false });
  });
  act(() => {
    jest.advanceTimersByTime(SILENCE - 10);
  });

  expect(onFinalResult).not.toHaveBeenCalled();
});

it('발화 종료 후 침묵 debounce 경과 → 누적 텍스트 1회 전송', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });
  await waitFor(() => expect(result.current.interimTranscript || result.current.transcript).toBeTruthy());
  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  expect(onFinalResult).toHaveBeenCalledTimes(1);
  expect(onFinalResult).toHaveBeenCalledWith('안녕하세요');
});

it('continuous 다중 세그먼트(final 여러 번) → 침묵 후 합쳐서 1회 전송', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
    engine.emit('result', { results: [{ transcript: '오늘 날씨 좋네요' }], isFinal: true });
  });
  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  expect(onFinalResult).toHaveBeenCalledTimes(1);
  expect(onFinalResult).toHaveBeenCalledWith('안녕하세요 오늘 날씨 좋네요');
});

it('동일 세그먼트 재emit → 중복 누적 안 함', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
    engine.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });
  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  expect(onFinalResult).toHaveBeenCalledWith('안녕하세요');
});

it('공백만 누적 → 침묵 후에도 onFinalResult 미호출', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '   ' }], isFinal: true });
  });
  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  expect(onFinalResult).not.toHaveBeenCalled();
});

it('engine 재등록(리렌더로 effect 재실행) 중에도 진행 중 침묵 타이머가 살아남아 flush', async () => {

  const e1 = makeMockEngine();
  const e2 = makeMockEngine();
  const onFinalResult = jest.fn();
  const { rerender } = renderHook(
    ({ eng }: { eng: ReturnType<typeof makeMockEngine> }) =>
      useSpeechInput({ engine: eng, onFinalResult, silenceMs: SILENCE }),
    { initialProps: { eng: e1 } },
  );

  act(() => {
    e1.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });

  act(() => {
    rerender({ eng: e2 });
  });

  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  expect(onFinalResult).toHaveBeenCalledWith('안녕하세요');
});

it('전송 후 누적 리셋 → 다음 발화는 이전 텍스트 안 섞임', async () => {
  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '첫번째' }], isFinal: true });
  });
  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '두번째' }], isFinal: true });
  });
  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  expect(onFinalResult).toHaveBeenNthCalledWith(1, '첫번째');
  expect(onFinalResult).toHaveBeenNthCalledWith(2, '두번째');
});
