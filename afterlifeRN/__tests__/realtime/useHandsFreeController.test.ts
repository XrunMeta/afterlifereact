import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHandsFreeController } from '../../src/realtime/useHandsFreeController';

function makeMockEngine() {
  const listeners: Record<string, Array<(p?: any) => void>> = {};
  const engine = {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    start: jest.fn(),
    stop: jest.fn(),
    addListener: (ev: string, cb: (p?: any) => void) => {
      (listeners[ev] ||= []).push(cb);
      return { remove: () => {} };
    },
    emit: (ev: string, p?: any) => (listeners[ev] || []).forEach((cb) => cb(p)),
    emitFinal: (text: string) => {
      engine.emit('result', { results: [{ transcript: text }], isFinal: true });
    },
  };
  return engine;
}

async function flush() {
  await act(async () => {
    await new Promise<void>((r) => setTimeout(r, 0));
  });
}

function renderController(opts: Parameters<typeof useHandsFreeController>[0]) {
  return renderHook(() => useHandsFreeController(opts));
}

it('enabled=true → STT 시작(listening)', async () => {
  const engine = makeMockEngine();
  const say = jest.fn().mockResolvedValue(undefined);
  const { result } = renderController({
    enabled: true,
    say,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  expect(result.current.phase).toBe('listening');
});

it('STT final → confirming 경유 → confirmMs 경과 후 say 호출 + sending 전환', async () => {
  const engine = makeMockEngine();
  const say = jest.fn().mockResolvedValue(undefined);
  const { result } = renderController({
    enabled: true,
    say,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
    silenceMs: 20,
    confirmMs: 500,
    confirmGate: true, 
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());

  jest.useFakeTimers();
  try {

    act(() => { engine.emitFinal('안녕'); });
    await waitFor(() => expect(result.current.phase).toBe('confirming'));
    expect(say).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(500); });
    await waitFor(() => expect(say).toHaveBeenCalledWith('안녕'));
    expect(result.current.phase).toBe('sending');
    expect(engine.stop).toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

it('toggleMic: listening → paused(마이크 끔)', async () => {
  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(result.current.phase).toBe('listening'));
  act(() => { result.current.toggleMic(); });
  expect(result.current.micOn).toBe(false);
  expect(result.current.phase).toBe('paused');
});

it('FINAL_RESULT 후 confirmMs 경과 시 자동 전송(say 호출)', async () => {
  const say = jest.fn().mockResolvedValue(undefined);
  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true,
    say,
    speechEngine: engine,
    silenceMs: 20,
    confirmMs: 2000,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    confirmGate: true, 
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());

  jest.useFakeTimers();
  try {

    act(() => { engine.emitFinal('안녕'); });
    await waitFor(() => expect(result.current.phase).toBe('confirming'));
    expect(result.current.pendingText).toBe('안녕');
    expect(say).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(2000); });
    await waitFor(() => expect(say).toHaveBeenCalledWith('안녕'));
    expect(result.current.phase).toBe('sending');
  } finally {
    jest.useRealTimers();
  }
});

it('연쇄 FINAL_RESULT가 카운트다운을 리셋 — 마지막 발화 기준으로만 say 호출', async () => {

  const say = jest.fn().mockResolvedValue(undefined);
  const engine = makeMockEngine();
  const confirmMs = 500; 
  const { result } = renderController({
    enabled: true,
    say,
    speechEngine: engine,
    silenceMs: 20,
    confirmMs,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    confirmGate: true, 
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  jest.useFakeTimers();
  try {

    act(() => { engine.emitFinal('가'); });
    await waitFor(() => expect(result.current.phase).toBe('confirming'));
    expect(say).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(300); });
    expect(say).not.toHaveBeenCalled();

    act(() => { engine.emitFinal('나'); });
    await waitFor(() => expect(result.current.pendingText).toContain('나'));

    expect(say).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(500); });
    await waitFor(() => expect(say).toHaveBeenCalledTimes(1));

    const calledWith: string = say.mock.calls[0][0] as string;
    expect(calledWith).toContain('가');
    expect(calledWith).toContain('나');
    expect(result.current.phase).toBe('sending');
  } finally {
    jest.useRealTimers();
  }
});

it('START_STT 후 start 이벤트 미emit → sttActive=false', async () => {
  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());

  expect(result.current.sttActive).toBe(false);
});

it('START_STT 후 start 이벤트 emit → sttActive=true', async () => {
  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  act(() => { engine.emit('start'); });
  expect(result.current.sttActive).toBe(true);
});

it('listening phase + sttActive=false(엔진 죽음, 워치독 만료 후) → 폴링이 startListening 재시도', async () => {

  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  expect(result.current.phase).toBe('listening');

  const prevStartCount = engine.start.mock.calls.length;
  await waitFor(
    () => expect(engine.start.mock.calls.length).toBeGreaterThan(prevStartCount),
    { timeout: 2200 }, 
  );
});

it('[MINOR-2] suppressed=true 중 self-heal 폴링이 startListening 호출 안 함', async () => {

  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());

  act(() => { engine.emit('start'); });
  expect(result.current.sttActive).toBe(true);

  act(() => { engine.emit('end'); }); 

  const countAfterFirstStart = engine.start.mock.calls.length;

  await new Promise<void>((r) => setTimeout(r, 350));

  const newStarts = engine.start.mock.calls.length - countAfterFirstStart;

  expect(newStarts).toBeLessThanOrEqual(1);
});

it('[B-1] CLONE_RESUME + self-heal 동시 틱 → startListening 중복 호출 안 됨', async () => {

  const engine = makeMockEngine();

  const getStatsReport = jest.fn().mockReturnValue(makeAudioStats(0.01));
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());

  expect(result.current.sttActive).toBe(false);
  const baseCount = engine.start.mock.calls.length;

  await new Promise<void>((r) => setTimeout(r, 600));
  const addedStarts = engine.start.mock.calls.length - baseCount;

  expect(addedStarts).toBe(0);
});

function makeAudioStats(audioLevel: number) {
  return Promise.resolve(
    new Map([['inbound-rtp-audio', { type: 'inbound-rtp', kind: 'audio', audioLevel }]])
  );
}

it('[A] suppress 중(sttSuppressed=true)엔 sttActive=true — 클론 에코 억제 구간은 녹색 유지', async () => {

  const engine = makeMockEngine();
  const getStatsReport = jest.fn().mockReturnValue(makeAudioStats(0.9));
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });

  await waitFor(() => expect(result.current.phase).toBe('listening'));
  act(() => { engine.emit('start'); });
  await waitFor(() => expect(result.current.sttActive).toBe(true));

  await waitFor(
    () => expect(engine.stop).toHaveBeenCalled(),
    { timeout: 600 },
  );

  expect(result.current.sttActive).toBe(true);
});

it('[CLONE_RESUME 600] suppress 후 클론 무음 — 400ms엔 재개 안 함, 800ms엔 재개', async () => {

  const engine = makeMockEngine();
  let level = 0.9; 
  const getStatsReport = jest.fn(() => makeAudioStats(level));
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(result.current.phase).toBe('listening'));
  act(() => { engine.emit('start'); });

  await waitFor(() => expect(engine.stop).toHaveBeenCalled(), { timeout: 800 });
  expect(result.current.sttActive).toBe(true); 

  const startsAtSilence = engine.start.mock.calls.length;
  level = 0.01;

  await new Promise<void>((r) => setTimeout(r, 400));
  expect(engine.start.mock.calls.length).toBe(startsAtSilence);

  await new Promise<void>((r) => setTimeout(r, 500));
  expect(engine.start.mock.calls.length).toBeGreaterThan(startsAtSilence);
});

it('[A] suppressed=false + listeningDebounced=false → sttActive=false (진짜 실패)', async () => {

  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null, 
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());

  act(() => { engine.emit('start'); });
  await waitFor(() => expect(result.current.sttActive).toBe(true));

  act(() => { engine.emit('error', { message: 'permission_denied' }); });

  await waitFor(() => expect(result.current.sttActive).toBe(false), { timeout: 3000 });
});

it('[BLOCKER] suppress=true 중 MIC_OFF → STOP_STT suppress 리셋 → paused에서 sttActive false', async () => {

  const engine = makeMockEngine();
  const getStatsReport = jest.fn().mockReturnValue(makeAudioStats(0.9));
  const say = jest.fn().mockResolvedValue(undefined);
  const { result } = renderController({
    enabled: true,
    say,
    getStatsReport,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(result.current.phase).toBe('listening'));
  act(() => { engine.emit('start'); });
  await waitFor(() => expect(result.current.sttActive).toBe(true));

  await waitFor(() => expect(engine.stop).toHaveBeenCalled(), { timeout: 600 });

  expect(result.current.sttActive).toBe(true);

  act(() => { result.current.toggleMic(); });
  await waitFor(() => expect(result.current.phase).toBe('paused'));

  expect(result.current.sttActive).toBe(false);
});

it('[BLOCKER] CALL_ENDED → STOP_STT suppress 리셋 → idle 이후 suppress 유출 없음', async () => {

  const engine = makeMockEngine();
  const getStatsReport = jest.fn().mockReturnValue(makeAudioStats(0.9));
  const { result, rerender } = renderHook(
    (props: Parameters<typeof useHandsFreeController>[0]) => useHandsFreeController(props),
    {
      initialProps: {
        enabled: true,
        say: jest.fn().mockResolvedValue(undefined),
        getStatsReport,
        notifySpeechEnd: jest.fn(),
        speechEngine: engine,
      },
    }
  );
  await waitFor(() => expect(result.current.phase).toBe('listening'));
  act(() => { engine.emit('start'); });

  await waitFor(() => expect(engine.stop).toHaveBeenCalled(), { timeout: 600 });

  rerender({
    enabled: false,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(result.current.phase).toBe('idle'));

  expect(result.current.sttActive).toBe(false);
});

it('[B] say reject → sending→listening(RESPONSE_END) 직후 grace 내 suppress 스킵', async () => {

  const engine = makeMockEngine();
  const getStatsReport = jest.fn().mockReturnValue(makeAudioStats(0.9));
  const say = jest.fn().mockRejectedValue(new Error('test-reject'));
  const { result } = renderController({
    enabled: true,
    say,
    getStatsReport,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
    silenceMs: 20,
    confirmMs: 50, 
    confirmGate: true, 
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  act(() => { engine.emit('start'); });
  await waitFor(() => expect(result.current.phase).toBe('listening'));

  act(() => { engine.emitFinal('테스트'); });
  await waitFor(() => expect(result.current.phase).toBe('confirming'));

  await waitFor(() => expect(result.current.phase).toBe('listening'), { timeout: 500 });

  const stopCountAtGraceEntry = engine.stop.mock.calls.length;
  await new Promise<void>((r) => setTimeout(r, 400)); 
  const stopCountDuringGrace = engine.stop.mock.calls.length;
  expect(stopCountDuringGrace).toBe(stopCountAtGraceEntry);

  await new Promise<void>((r) => setTimeout(r, 700));
  const stopCountAfterGrace = engine.stop.mock.calls.length;
  expect(stopCountAfterGrace).toBeGreaterThan(stopCountDuringGrace);
});

it('[B] grace 미설정(초기) 상태에서 audioLevel 높으면 suppress 발동 — grace 경과 후 동작 동일', async () => {

  const engine = makeMockEngine();
  let audioLevel = 0.01; 
  const getStatsReport = jest.fn().mockImplementation(() =>
    Promise.resolve(new Map([['inbound-rtp-audio', { type: 'inbound-rtp', kind: 'audio', audioLevel }]]))
  );
  const { result } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport,
    notifySpeechEnd: jest.fn(),
    speechEngine: engine,
  });
  await waitFor(() => expect(result.current.phase).toBe('listening'));
  act(() => { engine.emit('start'); });
  await waitFor(() => expect(result.current.sttActive).toBe(true));

  await new Promise<void>((r) => setTimeout(r, 400));

  expect(result.current.sttActive).toBe(true);

  audioLevel = 0.9;
  const stopBefore = engine.stop.mock.calls.length;

  await new Promise<void>((r) => setTimeout(r, 400));

  const stopAfter = engine.stop.mock.calls.length;

  expect(stopAfter).toBeGreaterThan(stopBefore);

  expect(result.current.sttActive).toBe(true);
});

describe('greeting 배선', () => {
  const baseOpts = (over: any = {}) => ({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: makeMockEngine(),
    ...over,
  });

  it('enabled + greeting → greet() 호출, phase=greeting', async () => {
    const greet = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useHandsFreeController(baseOpts({ greeting: true, greet })));
    await act(async () => {});
    expect(greet).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe('greeting');
  });

  it('lastSignal speech_start → speaking 전이', async () => {
    let signal: any = null;
    const { result, rerender } = renderHook(
      (props: any) => useHandsFreeController(baseOpts({ greeting: true, greet: jest.fn().mockResolvedValue(undefined), lastSignal: props.signal })),
      { initialProps: { signal } });
    await act(async () => {});
    signal = { type: 'speech_start', seq: 1, ts: 1 };
    rerender({ signal });
    expect(result.current.phase).toBe('speaking');
  });

  it('lastSignal speech_end → listening 복귀', async () => {
    const { result, rerender } = renderHook(
      (props: any) => useHandsFreeController(baseOpts({ greeting: true, greet: jest.fn().mockResolvedValue(undefined), lastSignal: props.signal })),
      { initialProps: { signal: null as any } });
    await act(async () => {});
    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    rerender({ signal: { type: 'speech_end', seq: 1, ts: 2 } });
    expect(result.current.phase).toBe('listening');
  });

  it('타임아웃 내 speech_start 없으면 speak(fallback) 호출', async () => {
    jest.useFakeTimers();
    const speak = jest.fn().mockResolvedValue(undefined);
    renderHook(() => useHandsFreeController(baseOpts({
      greeting: true, greet: jest.fn().mockResolvedValue(undefined),
      speak, greetTimeoutMs: 3000, fallbackText: '여보세요?',
    })));
    await act(async () => {});
    act(() => { jest.advanceTimersByTime(3000); });
    expect(speak).toHaveBeenCalledWith('여보세요?');
    jest.useRealTimers();
  });

  it('speech_start 도착하면 타임아웃 폴백 안 함', async () => {
    jest.useFakeTimers();
    const speak = jest.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      (props: any) => useHandsFreeController(baseOpts({
        greeting: true, greet: jest.fn().mockResolvedValue(undefined),
        speak, greetTimeoutMs: 3000, lastSignal: props.signal,
      })),
      { initialProps: { signal: null as any } });
    await act(async () => {});
    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(speak).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('greeting=false면 기존처럼 즉시 listening (무회귀)', async () => {
    const greet = jest.fn();
    const { result } = renderHook(() =>
      useHandsFreeController(baseOpts({ greeting: false, greet })));
    await act(async () => {});
    expect(greet).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('listening');
  });

  it('폴백 speak 후에도 speech_start가 안 오면 greetTimeoutMs 후 phase가 listening이 된다', async () => {
    jest.useFakeTimers();
    const speak = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useHandsFreeController(baseOpts({
        greeting: true,
        greet: jest.fn().mockResolvedValue(undefined),
        speak,
        greetTimeoutMs: 3000,
        fallbackText: '여보세요?',
      })));
    await act(async () => {});

    act(() => { jest.advanceTimersByTime(3000); });
    expect(speak).toHaveBeenCalledWith('여보세요?');

    expect(result.current.phase).toBe('greeting');

    act(() => { jest.advanceTimersByTime(3000); });
    await waitFor(() => expect(result.current.phase).toBe('listening'));
    jest.useRealTimers();
  });
});

describe('greeting=false off-path speech_end 안전성', () => {
  const makeSpeakingEngine = () => makeMockEngine();

  it('speaking 중(greeting=true 진입) lastSignal speech_end → phase가 단일하게 listening으로 전이 (off-path 안전성)', async () => {

    const engine = makeSpeakingEngine();
    let signal: any = null;
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController({
          enabled: true,
          say: jest.fn().mockResolvedValue(undefined),
          getStatsReport: () => null,
          notifySpeechEnd: jest.fn(),
          speechEngine: engine,
          greeting: true,
          greet: jest.fn().mockResolvedValue(undefined),
          lastSignal: props.signal,
        }),
      { initialProps: { signal } },
    );

    await waitFor(() => expect(result.current.phase).toBe('greeting'));

    signal = { type: 'speech_start', seq: 1, ts: Date.now() };
    rerender({ signal });
    await waitFor(() => expect(result.current.phase).toBe('speaking'));

    signal = { type: 'speech_end', seq: 1, ts: Date.now() + 100 };
    rerender({ signal });
    await waitFor(() => expect(result.current.phase).toBe('listening'));

    expect(result.current.phase).toBe('listening');
  });

  it('RESPONSE_END idempotent — listening 상태에서 RESPONSE_END 재도착 시 listening 유지', async () => {

    const engine = makeSpeakingEngine();
    let signal: any = null;
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController({
          enabled: true,
          say: jest.fn().mockResolvedValue(undefined),
          getStatsReport: () => null,
          notifySpeechEnd: jest.fn(),
          speechEngine: engine,
          greeting: false,
          lastSignal: props.signal,
        }),
      { initialProps: { signal } },
    );

    await waitFor(() => expect(result.current.phase).toBe('listening'));
    expect(result.current.phase).toBe('listening');

    signal = { type: 'speech_end', seq: 1, ts: Date.now() };
    rerender({ signal });
    await act(async () => {});
    expect(result.current.phase).toBe('listening');

    signal = { type: 'speech_end', seq: 2, ts: Date.now() + 10 };
    rerender({ signal });
    await act(async () => {});
    expect(result.current.phase).toBe('listening');
  });
});

describe('signalGating 배선', () => {
  const gatedOpts = (over: any = {}) => ({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: makeMockEngine(),
    signalGating: true,
    ...over,
  });

  it('speech_end 신호 → listening 복귀(RESPONSE_DONE 경로)', async () => {
    const engine = makeMockEngine();
    const { result, rerender } = renderHook(
      (props: any) => useHandsFreeController(gatedOpts({ speechEngine: engine, silenceMs: 20, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await waitFor(() => expect(result.current.phase).toBe('listening'));

    act(() => { engine.emitFinal('안녕'); });
    await waitFor(() => expect(result.current.phase).toBe('sending'));

    rerender({ signal: { type: 'speech_end', seq: 1, ts: 1 } });
    await waitFor(() => expect(result.current.phase).toBe('listening'));
  });

  it('감지기 onResponseEnd 는 게이팅 중 무시 — sending 유지', async () => {

    const engine = makeMockEngine();
    const getStatsReport = jest.fn(() =>
      Promise.resolve(new Map([['a', { type: 'inbound-rtp', kind: 'audio', audioLevel: 0 }]])));
    const { result } = renderController(gatedOpts({ speechEngine: engine, silenceMs: 20, getStatsReport }));
    await waitFor(() => expect(result.current.phase).toBe('listening'));

    jest.useFakeTimers();
    try {
      act(() => { engine.emitFinal('안녕'); });
      await waitFor(() => expect(result.current.phase).toBe('sending'));

      await act(async () => { await jest.advanceTimersByTimeAsync(8200); });
      expect(result.current.phase).toBe('sending');
    } finally {
      jest.useRealTimers();
    }
  });

  it('신호 없음 responseDoneTimeoutMs 경과 → 강제 listening(폴백)', async () => {
    const engine = makeMockEngine();
    const { result } = renderController(gatedOpts({ speechEngine: engine, silenceMs: 20 }));
    await waitFor(() => expect(result.current.phase).toBe('listening'));

    jest.useFakeTimers();
    try {
      act(() => { engine.emitFinal('안녕'); });
      await waitFor(() => expect(result.current.phase).toBe('sending'));

      act(() => { jest.advanceTimersByTime(45000); });
      await waitFor(() => expect(result.current.phase).toBe('listening'));
    } finally {
      jest.useRealTimers();
    }
  });

  it('speech_text 수신은 폴백 타이머를 리셋한다', async () => {
    const engine = makeMockEngine();
    const { result, rerender } = renderHook(
      (props: any) => useHandsFreeController(gatedOpts({ speechEngine: engine, silenceMs: 20, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await waitFor(() => expect(result.current.phase).toBe('listening'));

    act(() => { engine.emitFinal('안녕'); });
    await waitFor(() => expect(result.current.phase).toBe('sending'));

    jest.useFakeTimers();
    try {
      act(() => { jest.advanceTimersByTime(40000); });
      expect(result.current.phase).toBe('sending');

      rerender({ signal: { type: 'speech_text', seq: 1, ts: 1, text: '말하는 중' } });

      act(() => { jest.advanceTimersByTime(40000); });

      expect(result.current.phase).toBe('sending');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('Task 13: speech_end 오디오 꼬리 대기', () => {
  const baseOpts = (over: any = {}) => ({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    notifySpeechEnd: jest.fn(),
    greeting: true,
    greet: jest.fn().mockResolvedValue(undefined),
    ...over,
  });

  afterEach(() => { jest.useRealTimers(); });

  it('(a) 클론 오디오가 이미 무음이면 speech_end 후 폴링 틱에서 listening 전환', async () => {
    jest.useFakeTimers();
    const engine = makeMockEngine();
    const getStatsReport = jest.fn(() => makeAudioStats(0)); 
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController(baseOpts({ speechEngine: engine, getStatsReport, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await act(async () => {});
    expect(result.current.phase).toBe('greeting');

    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(result.current.phase).toBe('speaking');

    rerender({ signal: { type: 'speech_end', seq: 1, ts: 2 } });

    expect(result.current.phase).toBe('speaking');

    await act(async () => { await jest.advanceTimersByTimeAsync(800); });
    expect(result.current.phase).toBe('listening');
  });

  it('(b) 클론 오디오 재생 중(level 높음)이면 전환 안 됨 — 무음 전환 후에야 listening', async () => {
    jest.useFakeTimers();
    const engine = makeMockEngine();
    let level = 0.9; 
    const getStatsReport = jest.fn(() => makeAudioStats(level));
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController(baseOpts({ speechEngine: engine, getStatsReport, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await act(async () => {});
    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(result.current.phase).toBe('speaking');

    rerender({ signal: { type: 'speech_end', seq: 1, ts: 2 } });

    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(result.current.phase).toBe('speaking');

    level = 0.01;
    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(result.current.phase).toBe('listening');
  });

  it('(c) 안전망 RESPONSE_DONE_TAIL_MAX_MS(5s) — 무음 확인 실패해도 강제 전환', async () => {
    jest.useFakeTimers();
    const engine = makeMockEngine();

    const getStatsReport = jest.fn(() => makeAudioStats(0.9));
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController(baseOpts({ speechEngine: engine, getStatsReport, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await act(async () => {});
    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(result.current.phase).toBe('speaking');

    rerender({ signal: { type: 'speech_end', seq: 1, ts: 2 } });

    await act(async () => { await jest.advanceTimersByTimeAsync(4900); });
    expect(result.current.phase).toBe('speaking');

    await act(async () => { await jest.advanceTimersByTimeAsync(200); });
    expect(result.current.phase).toBe('listening');
  });

  it('(d) pending 활성 중 CALL_ENDED(enabled=false) → 안전망 타이머 정리, 5s 경과해도 dispatch 없음', async () => {
    jest.useFakeTimers();
    const engine = makeMockEngine();

    const getStatsReport = jest.fn(() => makeAudioStats(0.9));
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController(baseOpts({
          enabled: props.enabled, speechEngine: engine, getStatsReport, lastSignal: props.signal,
        })),
      { initialProps: { enabled: true, signal: null as any } },
    );
    await act(async () => {});
    rerender({ enabled: true, signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(result.current.phase).toBe('speaking');

    rerender({ enabled: true, signal: { type: 'speech_end', seq: 1, ts: 2 } });
    expect(result.current.phase).toBe('speaking'); 

    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(result.current.phase).toBe('speaking');

    const timerCountBeforeEnd = jest.getTimerCount();

    rerender({ enabled: false, signal: { type: 'speech_end', seq: 1, ts: 2 } });
    await act(async () => {});
    expect(result.current.phase).toBe('idle');

    expect(jest.getTimerCount()).toBeLessThan(timerCountBeforeEnd);

    await act(async () => { await jest.advanceTimersByTimeAsync(5000); });
    expect(result.current.phase).toBe('idle');
  });

  it('(e) pending 활성 중 언마운트 → 안전망 타이머 정리(getTimerCount 0, 이후 advance 무해)', async () => {
    jest.useFakeTimers();
    const engine = makeMockEngine();
    const getStatsReport = jest.fn(() => makeAudioStats(0.9)); 
    const { result, rerender, unmount } = renderHook(
      (props: any) =>
        useHandsFreeController(baseOpts({ speechEngine: engine, getStatsReport, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await act(async () => {});
    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(result.current.phase).toBe('speaking');

    rerender({ signal: { type: 'speech_end', seq: 1, ts: 2 } });
    expect(result.current.phase).toBe('speaking'); 

    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(result.current.phase).toBe('speaking');

    unmount();

    expect(jest.getTimerCount()).toBe(0);

    expect(() => { jest.advanceTimersByTime(5000); }).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('Task 19: remaining_ms 기반 녹음 재개 게이팅', () => {
  const baseOpts = (over: any = {}) => ({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    notifySpeechEnd: jest.fn(),
    greeting: true,
    greet: jest.fn().mockResolvedValue(undefined),
    ...over,
  });

  afterEach(() => { jest.useRealTimers(); });

  it('(a) remainingMs=4000 — 4s 전엔 무음 폴링에도 speaking 유지, 4s 경과+무음 후 listening', async () => {
    jest.useFakeTimers();
    const engine = makeMockEngine();
    const getStatsReport = jest.fn(() => makeAudioStats(0)); 
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController(baseOpts({ speechEngine: engine, getStatsReport, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await act(async () => {});
    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(result.current.phase).toBe('speaking');

    rerender({ signal: { type: 'speech_end', seq: 1, ts: 2, remainingMs: 4000 } });
    expect(result.current.phase).toBe('speaking');

    await act(async () => { await jest.advanceTimersByTimeAsync(3800); });
    expect(result.current.phase).toBe('speaking');

    await act(async () => { await jest.advanceTimersByTimeAsync(400); });
    expect(result.current.phase).toBe('listening');
  });

  it('(b) remainingMs 없으면 기존(Task 13) 동작 그대로 — cloneResumeMs 무음 확인만으로 즉시 전환', async () => {
    jest.useFakeTimers();
    const engine = makeMockEngine();
    const getStatsReport = jest.fn(() => makeAudioStats(0)); 
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController(baseOpts({ speechEngine: engine, getStatsReport, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await act(async () => {});
    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(result.current.phase).toBe('speaking');

    rerender({ signal: { type: 'speech_end', seq: 1, ts: 2 } });
    expect(result.current.phase).toBe('speaking');

    await act(async () => { await jest.advanceTimersByTimeAsync(800); });
    expect(result.current.phase).toBe('listening');
  });

  it('(c) 안전망 = remainingMs + RESPONSE_DONE_TAIL_MAX_MS(5s) — 무음 확인 영원히 실패해도 강제 전환', async () => {
    jest.useFakeTimers();
    const engine = makeMockEngine();

    const getStatsReport = jest.fn(() => makeAudioStats(0.9));
    const { result, rerender } = renderHook(
      (props: any) =>
        useHandsFreeController(baseOpts({ speechEngine: engine, getStatsReport, lastSignal: props.signal })),
      { initialProps: { signal: null as any } },
    );
    await act(async () => {});
    rerender({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(result.current.phase).toBe('speaking');

    rerender({ signal: { type: 'speech_end', seq: 1, ts: 2, remainingMs: 4000 } });

    await act(async () => { await jest.advanceTimersByTimeAsync(8900); });
    expect(result.current.phase).toBe('speaking');

    await act(async () => { await jest.advanceTimersByTimeAsync(200); });
    expect(result.current.phase).toBe('listening');
  });
});

it('confirming 중 cancelConfirm() → listening, say 미호출', async () => {
  const say = jest.fn().mockResolvedValue(undefined);
  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true,
    say,
    speechEngine: engine,
    silenceMs: 20,
    confirmMs: 2000,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    confirmGate: true, 
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  jest.useFakeTimers();
  try {
    act(() => { engine.emitFinal('취소할래'); });
    await waitFor(() => expect(result.current.phase).toBe('confirming'));

    act(() => { result.current.cancelConfirm(); });
    act(() => { jest.advanceTimersByTime(2000); });
    await waitFor(() => expect(result.current.phase).toBe('listening'));
    expect(say).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});
