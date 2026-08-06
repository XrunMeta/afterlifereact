import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSpeechInput, STT_WATCHDOG_MS, STALLED_DEBOUNCE_MS } from '../../src/realtime/useSpeechInput';

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
  const { result, rerender } = renderHook(
    ({ eng }: { eng: ReturnType<typeof makeMockEngine> }) =>
      useSpeechInput({ engine: eng, onFinalResult, silenceMs: SILENCE }),
    { initialProps: { eng: e1 } },
  );

  await act(async () => {
    await result.current.startListening();
  });

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

it('startListening 호출 후 start 이벤트 emit 전에는 listening=false', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));

  await act(async () => {
    await result.current.startListening();
  });

  expect(result.current.listening).toBe(false);
});

it('startListening 후 start 이벤트 emit → listening=true', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  expect(result.current.listening).toBe(false);
  act(() => {
    engine.emit('start');
  });
  expect(result.current.listening).toBe(true);
});

it('startListening 후 워치독 만료(기본 1500ms)까지 start 이벤트 없으면 listening=false 유지', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });

  act(() => { jest.advanceTimersByTime(1400); });
  expect(result.current.listening).toBe(false);

  act(() => { jest.advanceTimersByTime(200); });
  expect(result.current.listening).toBe(false);
});

it('startListening 후 result 이벤트 도착 → listening=true(워치독 해제)', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });
  expect(result.current.listening).toBe(true);
});

it('error 이벤트 → listening=false', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => {
    engine.emit('start');
  });
  expect(result.current.listening).toBe(true);
  act(() => {
    engine.emit('error', { message: 'network_error' });
  });
  expect(result.current.listening).toBe(false);
});

it('end 자동재시작: start 이벤트 의존, 워치독 재무장', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });

  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(true);

  act(() => { engine.emit('end'); });
  expect(result.current.listening).toBe(false);

  act(() => { jest.advanceTimersByTime(400); });

  expect(result.current.listening).toBe(false);

  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(true);
});

it('[B-1] startListening 진행 중(start 이벤트 미도착) 재호출 → engine.start 1회만', async () => {

  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });

  await act(async () => {
    await result.current.startListening();
  });
  await act(async () => {
    await result.current.startListening();
  });

  expect(engine.start).toHaveBeenCalledTimes(1);
});

it('[B-1] startListening 후 start 이벤트 도착(확정) → 이후 재호출 허용', async () => {

  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });

  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(true);

  act(() => { result.current.stopListening(); });
  await act(async () => {
    await result.current.startListening();
  });

  expect(engine.start).toHaveBeenCalledTimes(2);
});

it('[B-1] startListening 후 워치독 만료(확정 실패) → 이후 재호출 허용', async () => {

  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  expect(engine.start).toHaveBeenCalledTimes(1);

  act(() => { jest.advanceTimersByTime(STT_WATCHDOG_MS + 10); });

  await act(async () => {
    await result.current.startListening();
  });
  expect(engine.start).toHaveBeenCalledTimes(2);
});

it('[I-1] end 자동재시작 갭(listening=false 짧음) → stalled=false 유지(sttActive)', async () => {

  const engine = makeMockEngine();
  const { result } = renderHook(() =>
    useSpeechInput({ engine, silenceMs: SILENCE })
  );
  await act(async () => {
    await result.current.startListening();
  });

  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(true);
  expect(result.current.listeningDebounced).toBe(true);

  act(() => { engine.emit('end'); });
  expect(result.current.listening).toBe(false);

  act(() => { jest.advanceTimersByTime(1000); });
  expect(result.current.listeningDebounced).toBe(true);
});

it('[I-1] STT 장시간 미기동(stalled) → STALLED_DEBOUNCE_MS 경과 후 listeningDebounced=false', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() =>
    useSpeechInput({ engine, silenceMs: SILENCE })
  );
  await act(async () => {
    await result.current.startListening();
  });
  act(() => { engine.emit('start'); });
  expect(result.current.listeningDebounced).toBe(true);

  act(() => { engine.emit('end'); });

  act(() => { jest.advanceTimersByTime(STALLED_DEBOUNCE_MS + 100); });
  expect(result.current.listeningDebounced).toBe(false);
});

it('[MAJOR-1] STT_WATCHDOG_MS-1 시점에 start 없으면 listening=false 유지', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => { jest.advanceTimersByTime(STT_WATCHDOG_MS - 1); });
  expect(result.current.listening).toBe(false);
});

it('[MAJOR-1] STT_WATCHDOG_MS 정확히 만료 → listening=false 유지', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => { jest.advanceTimersByTime(STT_WATCHDOG_MS); });
  expect(result.current.listening).toBe(false);
});

it('[MAJOR-1] STT_WATCHDOG_MS 만료 전 start 도착 → listening=true', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });

  act(() => {
    jest.advanceTimersByTime(STT_WATCHDOG_MS - 1);
    engine.emit('start');
  });
  expect(result.current.listening).toBe(true);

  act(() => { jest.advanceTimersByTime(10); });
  expect(result.current.listening).toBe(true);
});

it('[MAJOR-2] iOS: start 이벤트 없이 result만 도착 → listening=true(워치독 해제)', async () => {

  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  expect(result.current.listening).toBe(false);

  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });

  expect(result.current.listening).toBe(true);

  act(() => { jest.advanceTimersByTime(STT_WATCHDOG_MS + 100); });
  expect(result.current.listening).toBe(true);
});

it('[MINOR-1] end 재시작 후 start 미도착(워치독 만료) → listening=false 유지', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(true);

  act(() => { engine.emit('end'); });
  act(() => { jest.advanceTimersByTime(400); });

  act(() => { jest.advanceTimersByTime(STT_WATCHDOG_MS + 10); });
  expect(result.current.listening).toBe(false);
});

it('[STOP-REOPEN] stopListening 후 늦게 도착한 result → listening=false 유지, onFinalResult 미호출', async () => {

  const engine = makeMockEngine();
  const onFinalResult = jest.fn();
  const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => { engine.emit('start'); });
  act(() => {
    engine.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });
  expect(result.current.listening).toBe(true);

  act(() => { result.current.stopListening(); });
  expect(result.current.listening).toBe(false);

  act(() => {
    engine.emit('result', { results: [{ transcript: '늦은잔여' }], isFinal: true });
  });
  expect(result.current.listening).toBe(false);
  act(() => {
    jest.advanceTimersByTime(SILENCE + 20);
  });
  expect(result.current.listening).toBe(false);
  expect(onFinalResult).not.toHaveBeenCalled();
});

it('[STOP-REOPEN] stopListening 후 늦게 도착한 start 이벤트 → listening=false 유지', async () => {
  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(true);
  act(() => { result.current.stopListening(); });
  expect(result.current.listening).toBe(false);

  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(false);
});

it('[STOP-REOPEN] stopListening 후 재차 startListening → 이어지는 result/start는 정상 확정(listening=true)', async () => {

  const engine = makeMockEngine();
  const { result } = renderHook(() => useSpeechInput({ engine, silenceMs: SILENCE }));
  await act(async () => {
    await result.current.startListening();
  });
  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(true);
  act(() => { result.current.stopListening(); });
  expect(result.current.listening).toBe(false);

  await act(async () => {
    await result.current.startListening();
  });
  expect(result.current.listening).toBe(false); 
  act(() => { engine.emit('start'); });
  expect(result.current.listening).toBe(true);
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

describe('onSpeechActivity', () => {
  it('non-final(interim) result 수신 시 호출된다', async () => {
    const engine = makeMockEngine();
    const onSpeechActivity = jest.fn();
    const { result } = renderHook(() => useSpeechInput({ engine, onSpeechActivity, silenceMs: SILENCE }));
    await act(async () => { await result.current.startListening(); });

    act(() => { engine.emit('result', { results: [{ transcript: '음' }], isFinal: false }); });
    expect(onSpeechActivity).toHaveBeenCalledTimes(1);
  });

  it('interim 없이 곧장 isFinal:true 만 오는 엔진에서도 호출된다(OEM 케이스)', async () => {

    const engine = makeMockEngine();
    const onSpeechActivity = jest.fn();
    const onFinalResult = jest.fn();
    const { result } = renderHook(() =>
      useSpeechInput({ engine, onSpeechActivity, onFinalResult, silenceMs: SILENCE }));
    await act(async () => { await result.current.startListening(); });

    act(() => { engine.emit('result', { results: [{ transcript: '안녕' }], isFinal: true }); });
    expect(onSpeechActivity).toHaveBeenCalledTimes(1);
    expect(result.current.interimTranscript).toBe(''); 

    act(() => { jest.advanceTimersByTime(SILENCE + 20); });
    expect(onFinalResult).toHaveBeenCalledTimes(1);
    expect(onFinalResult).toHaveBeenCalledWith('안녕');
  });

  it('stopListening 이후(want=false) 잔여 result 이벤트엔 호출되지 않는다', async () => {
    const engine = makeMockEngine();
    const onSpeechActivity = jest.fn();
    const { result } = renderHook(() => useSpeechInput({ engine, onSpeechActivity, silenceMs: SILENCE }));
    await act(async () => { await result.current.startListening(); });
    act(() => { result.current.stopListening(); });

    act(() => { engine.emit('result', { results: [{ transcript: '늦은 응답' }], isFinal: true }); });
    expect(onSpeechActivity).not.toHaveBeenCalled();
  });

  it('미지정이어도(옵션 생략) 기존 동작에 영향 없음', async () => {
    const engine = makeMockEngine();
    const onFinalResult = jest.fn();
    const { result } = renderHook(() => useSpeechInput({ engine, onFinalResult, silenceMs: SILENCE }));
    await act(async () => { await result.current.startListening(); });
    act(() => { engine.emit('result', { results: [{ transcript: '안녕' }], isFinal: true }); });
    act(() => { jest.advanceTimersByTime(SILENCE + 20); });
    expect(onFinalResult).toHaveBeenCalledWith('안녕');
  });
});
