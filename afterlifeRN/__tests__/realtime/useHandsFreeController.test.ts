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
