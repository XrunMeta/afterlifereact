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

it('subscribeSpeechEnd 콜백 발화 → sending이면 listening 복귀(서버 신호)', async () => {
  let fire: () => void = () => {};
  const subscribeSpeechEnd = (cb: () => void) => { fire = cb; return () => {}; };
  const say = jest.fn().mockResolvedValue(undefined);
  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true, say, speechEngine: engine, silenceMs: 20, confirmMs: 50,
    getStatsReport: () => null, notifySpeechEnd: () => {}, subscribeSpeechEnd,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  jest.useFakeTimers();
  try {

    act(() => { engine.emitFinal('안녕'); });
    await waitFor(() => expect(result.current.phase).toBe('confirming'));
    act(() => { jest.advanceTimersByTime(50); });
    await waitFor(() => expect(result.current.phase).toBe('sending'));

    act(() => fire());
    await waitFor(() => expect(result.current.phase).toBe('listening'));
  } finally {
    jest.useRealTimers();
  }
});

it('subscribeSpeechEnd 콜백이 listening 중 발화되면 무시', async () => {
  let fire: () => void = () => {};
  const subscribeSpeechEnd = (cb: () => void) => { fire = cb; return () => {}; };
  const engine = makeMockEngine();
  const { result } = renderController({
    enabled: true, say: jest.fn().mockResolvedValue(undefined), speechEngine: engine,
    getStatsReport: () => null, notifySpeechEnd: () => {}, subscribeSpeechEnd,
  });
  await waitFor(() => expect(result.current.phase).toBe('listening'));

  act(() => { fire(); });
  await new Promise<void>((r) => setTimeout(r, 10));
  expect(result.current.phase).toBe('listening');
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

it('언마운트 → subscribeSpeechEnd 구독 해제 호출', async () => {
  const unsub = jest.fn();
  const subscribeSpeechEnd = (_cb: () => void) => unsub;
  const engine = makeMockEngine();
  const { unmount } = renderController({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    speechEngine: engine,
    getStatsReport: () => null,
    notifySpeechEnd: () => {},
    subscribeSpeechEnd,
  });
  await waitFor(() => expect(engine.start).toHaveBeenCalled());
  unmount();
  expect(unsub).toHaveBeenCalled();
});
