import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_7df8a4 } from '../../src/realtime/useHandsFreeController';
import {
  v_6fc7ac,
  v_de0ee8,
  v_778702,
  v_3711bb,
  v_99c713,
} from '../../src/realtime/handsFree';
import { v_183224 } from '../../src/realtime/timingConfig';

function v_c2295a() {
  const v_9fde29 = {};
  const v_1e3df0 = {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    start: jest.fn(),
    stop: jest.fn(),
    addListener: (v_1d299c, v_16dbdb) => {
      (v_9fde29[v_1d299c] ||= []).push(v_16dbdb);
      return { remove: () => {} };
    },
    emit: (v_1d299c, v_e2a85c) => (v_9fde29[v_1d299c] || []).forEach((v_16dbdb) => v_16dbdb(v_e2a85c)),
    emitFinal: (v_9b6134) => {
      v_1e3df0.emit('result', { results: [{ transcript: v_9b6134 }], isFinal: true });
    },
  };
  return v_1e3df0;
}

async function v_b6e358() {
  await v_be73a0(async () => {
    await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, 0));
  });
}

function v_d84520(opts: Parameters<typeof v_7df8a4>[0]) {
  return v_0da18b(() => v_7df8a4(v_328259));
}

it('enabled=true → STT 시작(listening)', async () => {
  const v_1e3df0 = v_c2295a();
  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: v_3e2c87,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  expect(v_43c42e.current.phase).toBe('listening');
});

it('STT final → confirming 경유 → confirmMs 경과 후 say 호출 + sending 전환', async () => {
  const v_1e3df0 = v_c2295a();
  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: v_3e2c87,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
    silenceMs: 20,
    confirmMs: 500,
    confirmGate: true, 
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());

  jest.useFakeTimers();
  try {

    v_be73a0(() => { v_1e3df0.emitFinal('안녕'); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('confirming'));
    expect(v_3e2c87).not.toHaveBeenCalled();

    v_be73a0(() => { jest.advanceTimersByTime(500); });
    await v_81e49f(() => expect(v_3e2c87).toHaveBeenCalledWith('안녕'));
    expect(v_43c42e.current.phase).toBe('sending');
    expect(v_1e3df0.stop).toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

it('toggleMic: listening → paused(마이크 끔)', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  v_be73a0(() => { v_43c42e.current.toggleMic(); });
  expect(v_43c42e.current.micOn).toBe(false);
  expect(v_43c42e.current.phase).toBe('paused');
});

it('FINAL_RESULT 후 confirmMs 경과 시 자동 전송(say 호출)', async () => {
  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: v_3e2c87,
    speechEngine: v_1e3df0,
    silenceMs: 20,
    confirmMs: 2000,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    confirmGate: true, 
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());

  jest.useFakeTimers();
  try {

    v_be73a0(() => { v_1e3df0.emitFinal('안녕'); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('confirming'));
    expect(v_43c42e.current.pendingText).toBe('안녕');
    expect(v_3e2c87).not.toHaveBeenCalled();

    v_be73a0(() => { jest.advanceTimersByTime(2000); });
    await v_81e49f(() => expect(v_3e2c87).toHaveBeenCalledWith('안녕'));
    expect(v_43c42e.current.phase).toBe('sending');
  } finally {
    jest.useRealTimers();
  }
});

it('연쇄 FINAL_RESULT가 카운트다운을 리셋 — 마지막 발화 기준으로만 say 호출', async () => {

  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const v_1e3df0 = v_c2295a();
  const v_67bca4 = 500; 
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: v_3e2c87,
    speechEngine: v_1e3df0,
    silenceMs: 20,
    confirmMs: v_67bca4,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    confirmGate: true, 
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  jest.useFakeTimers();
  try {

    v_be73a0(() => { v_1e3df0.emitFinal('가'); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('confirming'));
    expect(v_3e2c87).not.toHaveBeenCalled();

    v_be73a0(() => { jest.advanceTimersByTime(300); });
    expect(v_3e2c87).not.toHaveBeenCalled();

    v_be73a0(() => { v_1e3df0.emitFinal('나'); });
    await v_81e49f(() => expect(v_43c42e.current.pendingText).toContain('나'));

    expect(v_3e2c87).not.toHaveBeenCalled();

    v_be73a0(() => { jest.advanceTimersByTime(500); });
    await v_81e49f(() => expect(v_3e2c87).toHaveBeenCalledTimes(1));

    const v_fa5c49 = v_3e2c87.mock.calls[0][0] as string;
    expect(v_fa5c49).toContain('가');
    expect(v_fa5c49).toContain('나');
    expect(v_43c42e.current.phase).toBe('sending');
  } finally {
    jest.useRealTimers();
  }
});

it('START_STT 후 start 이벤트 미emit → sttActive=false', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());

  expect(v_43c42e.current.sttActive).toBe(false);
});

it('START_STT 후 start 이벤트 emit → sttActive=true', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.sttActive).toBe(true);
});

it('listening phase + sttActive=false(엔진 죽음, 워치독 만료 후) → 폴링이 startListening 재시도', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  expect(v_43c42e.current.phase).toBe('listening');

  const v_73d7c7 = v_1e3df0.start.mock.calls.length;
  await v_81e49f(
    () => expect(v_1e3df0.start.mock.calls.length).toBeGreaterThan(v_73d7c7),
    { timeout: 2200 }, 
  );
});

it('[MINOR-2] suppressed=true 중 self-heal 폴링이 startListening 호출 안 함', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());

  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.sttActive).toBe(true);

  v_be73a0(() => { v_1e3df0.emit('end'); }); 

  const v_65af5a = v_1e3df0.start.mock.calls.length;

  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, 350));

  const v_04de7c = v_1e3df0.start.mock.calls.length - v_65af5a;

  expect(v_04de7c).toBeLessThanOrEqual(1);
});

it('[B-1] CLONE_RESUME + self-heal 동시 틱 → startListening 중복 호출 안 됨', async () => {

  const v_1e3df0 = v_c2295a();

  const v_791152 = jest.fn().mockReturnValue(v_cde30b(0.01));
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: v_791152,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());

  expect(v_43c42e.current.sttActive).toBe(false);
  const v_54b3f3 = v_1e3df0.start.mock.calls.length;

  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, 600));
  const v_a00cbf = v_1e3df0.start.mock.calls.length - v_54b3f3;

  expect(v_a00cbf).toBe(0);
});

function v_cde30b(v_29bc62) {
  return Promise.resolve(
    new Map([['inbound-rtp-audio', { type: 'inbound-rtp', kind: 'audio', audioLevel: v_29bc62 }]])
  );
}

it('[A] suppress 중(sttSuppressed=true)엔 sttActive=true — 클론 에코 억제 구간은 녹색 유지', async () => {

  const v_1e3df0 = v_c2295a();
  const v_791152 = jest.fn().mockReturnValue(v_cde30b(0.9));
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: v_791152,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });

  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  v_be73a0(() => { v_1e3df0.emit('start'); });
  await v_81e49f(() => expect(v_43c42e.current.sttActive).toBe(true));

  await v_81e49f(
    () => expect(v_1e3df0.stop).toHaveBeenCalled(),
    { timeout: 600 },
  );

  expect(v_43c42e.current.sttActive).toBe(true);
});

it('[CLONE_RESUME] suppress 후 클론 무음 — cloneResumeMs 전엔 재개 안 함, 경과 후 재개', async () => {

  const v_1e3df0 = v_c2295a();
  let v_fbe91e = 0.9; 
  const v_791152 = jest.fn(() => v_cde30b(v_fbe91e));
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: v_791152,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  v_be73a0(() => { v_1e3df0.emit('start'); });

  await v_81e49f(() => expect(v_1e3df0.stop).toHaveBeenCalled(), { timeout: 800 });
  expect(v_43c42e.current.sttActive).toBe(true); 

  const v_3105da = v_183224.cloneResumeMs;
  const v_2a192f = v_1e3df0.start.mock.calls.length;
  v_fbe91e = 0.01;

  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, v_3105da - 200));
  expect(v_1e3df0.start.mock.calls.length).toBe(v_2a192f);

  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, 500));
  expect(v_1e3df0.start.mock.calls.length).toBeGreaterThan(v_2a192f);
});

it('[A] suppressed=false + listeningDebounced=false → sttActive=false (진짜 실패)', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null, 
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());

  v_be73a0(() => { v_1e3df0.emit('start'); });
  await v_81e49f(() => expect(v_43c42e.current.sttActive).toBe(true));

  v_be73a0(() => { v_1e3df0.emit('error', { message: 'permission_denied' }); });

  await v_81e49f(() => expect(v_43c42e.current.sttActive).toBe(false), { timeout: 3000 });
});

it('[BLOCKER] suppress=true 중 MIC_OFF → STOP_STT suppress 리셋 → paused에서 sttActive false', async () => {

  const v_1e3df0 = v_c2295a();
  const v_791152 = jest.fn().mockReturnValue(v_cde30b(0.9));
  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: v_3e2c87,
    getStatsReport: v_791152,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  v_be73a0(() => { v_1e3df0.emit('start'); });
  await v_81e49f(() => expect(v_43c42e.current.sttActive).toBe(true));

  await v_81e49f(() => expect(v_1e3df0.stop).toHaveBeenCalled(), { timeout: 600 });

  expect(v_43c42e.current.sttActive).toBe(true);

  v_be73a0(() => { v_43c42e.current.toggleMic(); });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('paused'));

  expect(v_43c42e.current.sttActive).toBe(false);
});

it('[BLOCKER] CALL_ENDED → STOP_STT suppress 리셋 → idle 이후 suppress 유출 없음', async () => {

  const v_1e3df0 = v_c2295a();
  const v_791152 = jest.fn().mockReturnValue(v_cde30b(0.9));
  const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
    (props: Parameters<typeof v_7df8a4>[0]) => v_7df8a4(v_b1927c),
    {
      initialProps: {
        enabled: true,
        say: jest.fn().mockResolvedValue(undefined),
        getStatsReport: v_791152,
        notifySpeechEnd: jest.fn(),
        speechEngine: v_1e3df0,
      },
    }
  );
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  v_be73a0(() => { v_1e3df0.emit('start'); });

  await v_81e49f(() => expect(v_1e3df0.stop).toHaveBeenCalled(), { timeout: 600 });

  v_2726cb({
    enabled: false,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: v_791152,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('idle'));

  expect(v_43c42e.current.sttActive).toBe(false);
});

it('[B] say reject → sending→listening(RESPONSE_END) 직후 grace 내 suppress 스킵', async () => {

  const v_1e3df0 = v_c2295a();
  const v_791152 = jest.fn().mockReturnValue(v_cde30b(0.9));
  const v_3e2c87 = jest.fn().mockRejectedValue(new Error('test-reject'));
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: v_3e2c87,
    getStatsReport: v_791152,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
    silenceMs: 20,
    confirmMs: 50, 
    confirmGate: true, 
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  v_be73a0(() => { v_1e3df0.emit('start'); });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));

  v_be73a0(() => { v_1e3df0.emitFinal('테스트'); });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('confirming'));

  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'), { timeout: 500 });

  const v_59f40c = v_183224.cloneTailGraceMs;
  const v_a56917 = v_1e3df0.stop.mock.calls.length;
  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, 400)); 
  const v_4caf35 = v_1e3df0.stop.mock.calls.length;
  expect(v_4caf35).toBe(v_a56917);

  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, v_59f40c - 400 + 300));
  const v_5ef960 = v_1e3df0.stop.mock.calls.length;
  expect(v_5ef960).toBeGreaterThan(v_4caf35);
});

it('[B] grace 미설정(초기) 상태에서 audioLevel 높으면 suppress 발동 — grace 경과 후 동작 동일', async () => {

  const v_1e3df0 = v_c2295a();
  let v_29bc62 = 0.01; 
  const v_791152 = jest.fn().mockImplementation(() =>
    Promise.resolve(new Map([['inbound-rtp-audio', { type: 'inbound-rtp', kind: 'audio', audioLevel: v_29bc62 }]]))
  );
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: v_791152,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_1e3df0,
  });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  v_be73a0(() => { v_1e3df0.emit('start'); });
  await v_81e49f(() => expect(v_43c42e.current.sttActive).toBe(true));

  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, 400));

  expect(v_43c42e.current.sttActive).toBe(true);

  v_29bc62 = 0.9;
  const v_404e2b = v_1e3df0.stop.mock.calls.length;

  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, 400));

  const v_0726ef = v_1e3df0.stop.mock.calls.length;

  expect(v_0726ef).toBeGreaterThan(v_404e2b);

  expect(v_43c42e.current.sttActive).toBe(true);
});

describe('greeting 배선', () => {
  const v_b2d8b4 = (v_b71f86 = {}) => ({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_c2295a(),
    ...v_b71f86,
  });

  it('enabled + greeting → greet() 호출, phase=greeting', async () => {
    const v_009e58 = jest.fn().mockResolvedValue(undefined);
    const { result: v_43c42e } = v_0da18b(() =>
      v_7df8a4(v_b2d8b4({ greeting: true, greet: v_009e58 })));
    await v_be73a0(async () => {});
    expect(v_009e58).toHaveBeenCalledTimes(1);
    expect(v_43c42e.current.phase).toBe('greeting');
  });

  it('lastSignal speech_start → speaking 전이', async () => {
    let v_361415 = null;
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_7df8a4(v_b2d8b4({ greeting: true, greet: jest.fn().mockResolvedValue(undefined), lastSignal: v_b1927c.signal })),
      { initialProps: { signal: v_361415 } });
    await v_be73a0(async () => {});
    v_361415 = { type: 'speech_start', seq: 1, ts: 1 };
    v_2726cb({ signal: v_361415 });
    expect(v_43c42e.current.phase).toBe('speaking');
  });

  it('lastSignal speech_end → listening 복귀', async () => {
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_7df8a4(v_b2d8b4({ greeting: true, greet: jest.fn().mockResolvedValue(undefined), lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } });
    await v_be73a0(async () => {});
    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2 } });
    expect(v_43c42e.current.phase).toBe('listening');
  });

  it('타임아웃 내 speech_start 없으면 speak(fallback) 호출', async () => {
    jest.useFakeTimers();
    const v_a1d9db = jest.fn().mockResolvedValue(undefined);
    v_0da18b(() => v_7df8a4(v_b2d8b4({
      greeting: true, greet: jest.fn().mockResolvedValue(undefined),
      speak: v_a1d9db, greetTimeoutMs: 3000, fallbackText: '여보세요?',
    })));
    await v_be73a0(async () => {});
    v_be73a0(() => { jest.advanceTimersByTime(3000); });
    expect(v_a1d9db).toHaveBeenCalledWith('여보세요?');
    jest.useRealTimers();
  });

  it('speech_start 도착하면 타임아웃 폴백 안 함', async () => {
    jest.useFakeTimers();
    const v_a1d9db = jest.fn().mockResolvedValue(undefined);
    const { rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_7df8a4(v_b2d8b4({
        greeting: true, greet: jest.fn().mockResolvedValue(undefined),
        speak: v_a1d9db, greetTimeoutMs: 3000, lastSignal: v_b1927c.signal,
      })),
      { initialProps: { signal: null as any } });
    await v_be73a0(async () => {});
    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    v_be73a0(() => { jest.advanceTimersByTime(3000); });
    expect(v_a1d9db).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('greeting=false면 기존처럼 즉시 listening (무회귀)', async () => {
    const v_009e58 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_7df8a4(v_b2d8b4({ greeting: false, greet: v_009e58 })));
    await v_be73a0(async () => {});
    expect(v_009e58).not.toHaveBeenCalled();
    expect(v_43c42e.current.phase).toBe('listening');
  });

  it('폴백 speak 후에도 speech_start가 안 오면 greetTimeoutMs 후 phase가 listening이 된다', async () => {
    jest.useFakeTimers();
    const v_a1d9db = jest.fn().mockResolvedValue(undefined);
    const { result: v_43c42e } = v_0da18b(() =>
      v_7df8a4(v_b2d8b4({
        greeting: true,
        greet: jest.fn().mockResolvedValue(undefined),
        speak: v_a1d9db,
        greetTimeoutMs: 3000,
        fallbackText: '여보세요?',
      })));
    await v_be73a0(async () => {});

    v_be73a0(() => { jest.advanceTimersByTime(3000); });
    expect(v_a1d9db).toHaveBeenCalledWith('여보세요?');

    expect(v_43c42e.current.phase).toBe('greeting');

    v_be73a0(() => { jest.advanceTimersByTime(3000); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
    jest.useRealTimers();
  });
});

describe('greeting=false off-path speech_end 안전성', () => {
  const v_918735 = () => v_c2295a();

  it('speaking 중(greeting=true 진입) lastSignal speech_end → phase가 단일하게 listening으로 전이 (off-path 안전성)', async () => {

    const v_1e3df0 = v_918735();
    let v_361415 = null;
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4({
          enabled: true,
          say: jest.fn().mockResolvedValue(undefined),
          getStatsReport: () => null,
          notifySpeechEnd: jest.fn(),
          speechEngine: v_1e3df0,
          greeting: true,
          greet: jest.fn().mockResolvedValue(undefined),
          lastSignal: v_b1927c.signal,
        }),
      { initialProps: { signal: v_361415 } },
    );

    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('greeting'));

    v_361415 = { type: 'speech_start', seq: 1, ts: Date.now() };
    v_2726cb({ signal: v_361415 });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('speaking'));

    v_361415 = { type: 'speech_end', seq: 1, ts: Date.now() + 100 };
    v_2726cb({ signal: v_361415 });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));

    expect(v_43c42e.current.phase).toBe('listening');
  });

  it('RESPONSE_END idempotent — listening 상태에서 RESPONSE_END 재도착 시 listening 유지', async () => {

    const v_1e3df0 = v_918735();
    let v_361415 = null;
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4({
          enabled: true,
          say: jest.fn().mockResolvedValue(undefined),
          getStatsReport: () => null,
          notifySpeechEnd: jest.fn(),
          speechEngine: v_1e3df0,
          greeting: false,
          lastSignal: v_b1927c.signal,
        }),
      { initialProps: { signal: v_361415 } },
    );

    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
    expect(v_43c42e.current.phase).toBe('listening');

    v_361415 = { type: 'speech_end', seq: 1, ts: Date.now() };
    v_2726cb({ signal: v_361415 });
    await v_be73a0(async () => {});
    expect(v_43c42e.current.phase).toBe('listening');

    v_361415 = { type: 'speech_end', seq: 2, ts: Date.now() + 10 };
    v_2726cb({ signal: v_361415 });
    await v_be73a0(async () => {});
    expect(v_43c42e.current.phase).toBe('listening');
  });
});

describe('signalGating 배선', () => {
  const v_5320d1 = (v_b71f86 = {}) => ({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    speechEngine: v_c2295a(),
    signalGating: true,
    ...v_b71f86,
  });

  it('speech_end 신호 → listening 복귀(RESPONSE_DONE 경로)', async () => {
    const v_1e3df0 = v_c2295a();
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_7df8a4(v_5320d1({ speechEngine: v_1e3df0, silenceMs: 20, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));

    v_be73a0(() => { v_1e3df0.emitFinal('안녕'); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('sending'));

    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 1 } });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  });

  it('감지기 onResponseEnd 는 게이팅 중 무시 — sending 유지', async () => {

    const v_1e3df0 = v_c2295a();
    const v_791152 = jest.fn(() =>
      Promise.resolve(new Map([['a', { type: 'inbound-rtp', kind: 'audio', audioLevel: 0 }]])));
    const { result: v_43c42e } = v_d84520(v_5320d1({ speechEngine: v_1e3df0, silenceMs: 20, getStatsReport: v_791152 }));
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));

    jest.useFakeTimers();
    try {
      v_be73a0(() => { v_1e3df0.emitFinal('안녕'); });
      await v_81e49f(() => expect(v_43c42e.current.phase).toBe('sending'));

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(8200); });
      expect(v_43c42e.current.phase).toBe('sending');
    } finally {
      jest.useRealTimers();
    }
  });

  it('신호 없음 responseDoneTimeoutMs 경과 → 강제 listening(폴백)', async () => {
    const v_1e3df0 = v_c2295a();
    const { result: v_43c42e } = v_d84520(v_5320d1({ speechEngine: v_1e3df0, silenceMs: 20 }));
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));

    jest.useFakeTimers();
    try {
      v_be73a0(() => { v_1e3df0.emitFinal('안녕'); });
      await v_81e49f(() => expect(v_43c42e.current.phase).toBe('sending'));

      v_be73a0(() => { jest.advanceTimersByTime(45000); });
      await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
    } finally {
      jest.useRealTimers();
    }
  });

  it('speech_text 수신은 폴백 타이머를 리셋한다', async () => {
    const v_1e3df0 = v_c2295a();
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_7df8a4(v_5320d1({ speechEngine: v_1e3df0, silenceMs: 20, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));

    v_be73a0(() => { v_1e3df0.emitFinal('안녕'); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('sending'));

    jest.useFakeTimers();
    try {
      v_be73a0(() => { jest.advanceTimersByTime(40000); });
      expect(v_43c42e.current.phase).toBe('sending');

      v_2726cb({ signal: { type: 'speech_text', seq: 1, ts: 1, text: '말하는 중' } });

      v_be73a0(() => { jest.advanceTimersByTime(40000); });

      expect(v_43c42e.current.phase).toBe('sending');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('Task 13: speech_end 오디오 꼬리 대기', () => {
  const v_b2d8b4 = (v_b71f86 = {}) => ({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    notifySpeechEnd: jest.fn(),
    greeting: true,
    greet: jest.fn().mockResolvedValue(undefined),
    ...v_b71f86,
  });

  afterEach(() => { jest.useRealTimers(); });

  it('(a) 클론 오디오가 이미 무음이면 speech_end 후 폴링 틱에서 listening 전환', async () => {
    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();
    const v_791152 = jest.fn(() => v_cde30b(0)); 
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4(v_b2d8b4({ speechEngine: v_1e3df0, getStatsReport: v_791152, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_be73a0(async () => {});
    expect(v_43c42e.current.phase).toBe('greeting');

    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2 } });

    expect(v_43c42e.current.phase).toBe('speaking');

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(800); });
    expect(v_43c42e.current.phase).toBe('listening');
  });

  it('(b) 클론 오디오 재생 중(level 높음)이면 전환 안 됨 — 무음 전환 후에야 listening', async () => {
    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();
    let v_fbe91e = 0.9; 
    const v_791152 = jest.fn(() => v_cde30b(v_fbe91e));
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4(v_b2d8b4({ speechEngine: v_1e3df0, getStatsReport: v_791152, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_be73a0(async () => {});
    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2 } });

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_fbe91e = 0.01;
    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_183224.cloneResumeMs + 400); });
    expect(v_43c42e.current.phase).toBe('listening');
  });

  it('(c) 안전망 RESPONSE_DONE_TAIL_MAX_MS(5s) — 무음 확인 실패해도 강제 전환', async () => {
    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();

    const v_791152 = jest.fn(() => v_cde30b(0.9));
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4(v_b2d8b4({ speechEngine: v_1e3df0, getStatsReport: v_791152, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_be73a0(async () => {});
    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2 } });

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(4900); });
    expect(v_43c42e.current.phase).toBe('speaking');

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(200); });
    expect(v_43c42e.current.phase).toBe('listening');
  });

  it('(d) pending 활성 중 CALL_ENDED(enabled=false) → 안전망 타이머 정리, 5s 경과해도 dispatch 없음', async () => {
    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();

    const v_791152 = jest.fn(() => v_cde30b(0.9));
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4(v_b2d8b4({
          enabled: v_b1927c.enabled, speechEngine: v_1e3df0, getStatsReport: v_791152, lastSignal: v_b1927c.signal,
        })),
      { initialProps: { enabled: true, signal: null as any } },
    );
    await v_be73a0(async () => {});
    v_2726cb({ enabled: true, signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_2726cb({ enabled: true, signal: { type: 'speech_end', seq: 1, ts: 2 } });
    expect(v_43c42e.current.phase).toBe('speaking'); 

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(v_43c42e.current.phase).toBe('speaking');

    const v_f202d4 = jest.getTimerCount();

    v_2726cb({ enabled: false, signal: { type: 'speech_end', seq: 1, ts: 2 } });
    await v_be73a0(async () => {});
    expect(v_43c42e.current.phase).toBe('idle');

    expect(jest.getTimerCount()).toBeLessThan(v_f202d4);

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(5000); });
    expect(v_43c42e.current.phase).toBe('idle');
  });

  it('(e) pending 활성 중 언마운트 → 안전망 타이머 정리(getTimerCount 0, 이후 advance 무해)', async () => {
    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();
    const v_791152 = jest.fn(() => v_cde30b(0.9)); 
    const { result: v_43c42e, rerender: v_2726cb, unmount: v_67a0e6 } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4(v_b2d8b4({ speechEngine: v_1e3df0, getStatsReport: v_791152, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_be73a0(async () => {});
    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2 } });
    expect(v_43c42e.current.phase).toBe('speaking'); 

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_67a0e6();

    expect(jest.getTimerCount()).toBe(0);

    expect(() => { jest.advanceTimersByTime(5000); }).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('Task 19: remaining_ms 기반 녹음 재개 게이팅', () => {
  const v_b2d8b4 = (v_b71f86 = {}) => ({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    notifySpeechEnd: jest.fn(),
    greeting: true,
    greet: jest.fn().mockResolvedValue(undefined),
    ...v_b71f86,
  });

  afterEach(() => { jest.useRealTimers(); });

  it('(a) remainingMs=4000 — 봉인(4s-1s=3s) 전엔 무음 폴링에도 speaking 유지, 경과+무음 후 listening', async () => {
    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();
    const v_791152 = jest.fn(() => v_cde30b(0)); 
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4(v_b2d8b4({ speechEngine: v_1e3df0, getStatsReport: v_791152, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_be73a0(async () => {});
    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2, remainingMs: 4000 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(2800); });
    expect(v_43c42e.current.phase).toBe('speaking');

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(400); });
    expect(v_43c42e.current.phase).toBe('listening');
  });

  it('(b) remainingMs 없으면 기존(Task 13) 동작 그대로 — cloneResumeMs 무음 확인만으로 즉시 전환', async () => {
    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();
    const v_791152 = jest.fn(() => v_cde30b(0)); 
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4(v_b2d8b4({ speechEngine: v_1e3df0, getStatsReport: v_791152, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_be73a0(async () => {});
    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(800); });
    expect(v_43c42e.current.phase).toBe('listening');
  });

  it('(c) 안전망 = remainingMs + RESPONSE_DONE_TAIL_MAX_MS(5s) — 무음 확인 영원히 실패해도 강제 전환', async () => {
    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();

    const v_791152 = jest.fn(() => v_cde30b(0.9));
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) =>
        v_7df8a4(v_b2d8b4({ speechEngine: v_1e3df0, getStatsReport: v_791152, lastSignal: v_b1927c.signal })),
      { initialProps: { signal: null as any } },
    );
    await v_be73a0(async () => {});
    v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });
    expect(v_43c42e.current.phase).toBe('speaking');

    v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2, remainingMs: 4000 } });

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(8900); });
    expect(v_43c42e.current.phase).toBe('speaking');

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(200); });
    expect(v_43c42e.current.phase).toBe('listening');
  });
});

it('confirming 중 cancelConfirm() → listening, say 미호출', async () => {
  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true,
    say: v_3e2c87,
    speechEngine: v_1e3df0,
    silenceMs: 20,
    confirmMs: 2000,
    getStatsReport: () => null,
    notifySpeechEnd: jest.fn(),
    confirmGate: true, 
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  jest.useFakeTimers();
  try {
    v_be73a0(() => { v_1e3df0.emitFinal('취소할래'); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('confirming'));

    v_be73a0(() => { v_43c42e.current.cancelConfirm(); });
    v_be73a0(() => { jest.advanceTimersByTime(2000); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
    expect(v_3e2c87).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

describe('T-258: 무발화 워치독 · seq 배선', () => {

  it('🔴[C1] 조용한 listening 이 IDLE_GREET_DELAYS_MS[0] 만큼 이어지면 워치독 문구가 speak(고정 문구) 경로로 나간다 — say(LLM 턴) 금지', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      const v_a1d9db = jest.fn().mockResolvedValue(undefined);
      const { result: v_43c42e } = v_d84520({
        enabled: true,
        say: v_3e2c87,
        speak: v_a1d9db,
        getStatsReport: () => null,
        notifySpeechEnd: jest.fn(),
        speechEngine: v_1e3df0,
      });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_43c42e.current.phase).toBe('listening');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[0]); });

      expect(v_a1d9db).toHaveBeenCalledWith(v_de0ee8);
      expect(v_3e2c87).not.toHaveBeenCalled();

      expect(v_43c42e.current.phase).toBe('interrupting');
    } finally {
      jest.useRealTimers();
    }
  });

  it('🔴[C1] speak 미제공 환경(second)에서는 워치독 문구를 say 로 흘리지 않고 RESPONSE_DONE 으로 안전 복구한다', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      const { result: v_43c42e } = v_d84520({
        enabled: true,
        say: v_3e2c87,
        getStatsReport: () => null,
        notifySpeechEnd: jest.fn(),
        speechEngine: v_1e3df0,
      });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[0]); });
      expect(v_3e2c87).not.toHaveBeenCalled();
      expect(v_43c42e.current.phase).toBe('listening'); 
    } finally {
      jest.useRealTimers();
    }
  });

  it('STT partial(interimTranscript) 수신 중엔 USER_SPEECH_START 로 워치독이 걸리지 않는다', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      const v_a1d9db = jest.fn().mockResolvedValue(undefined);
      const { result: v_43c42e } = v_d84520({
        enabled: true,
        say: v_3e2c87,
        speak: v_a1d9db,
        getStatsReport: () => null,
        notifySpeechEnd: jest.fn(),
        speechEngine: v_1e3df0,
      });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_43c42e.current.phase).toBe('listening');

      v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '음' }], isFinal: false }); });
      expect(v_43c42e.current.interimTranscript).toBe('음');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[0]); });

      expect(v_a1d9db).not.toHaveBeenCalledWith(v_de0ee8);
      expect(v_3e2c87).not.toHaveBeenCalledWith(v_de0ee8);
      expect(v_43c42e.current.phase).toBe('listening');
    } finally {
      jest.useRealTimers();
    }
  });

  it('워치독이 두 차례(30s→60s) 발동 후 idleGreetCount 소진되면 더 이상 발동하지 않는다 — dc 신호 seq 왕복 포함', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      const v_a1d9db = jest.fn().mockResolvedValue(undefined); 
      let v_361415 = null;
      const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
        (v_b1927c) => v_7df8a4({
          enabled: true,
          say: v_3e2c87,
          speak: v_a1d9db,
          getStatsReport: () => null,
          notifySpeechEnd: jest.fn(),
          speechEngine: v_1e3df0,
          lastSignal: v_b1927c.signal,
        }),
        { initialProps: { signal: v_361415 } },
      );
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_43c42e.current.phase).toBe('listening');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[0]); });
      expect(v_a1d9db).toHaveBeenCalledTimes(1);
      expect(v_43c42e.current.phase).toBe('interrupting');

      v_361415 = { type: 'speech_start', ts: Date.now() };
      v_be73a0(() => { v_2726cb({ signal: v_361415 }); });
      v_361415 = { type: 'speech_end', ts: Date.now() + 10 };
      v_be73a0(() => { v_2726cb({ signal: v_361415 }); });
      expect(v_43c42e.current.phase).toBe('listening');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[1]); });
      expect(v_a1d9db).toHaveBeenCalledTimes(2);
      expect(v_43c42e.current.phase).toBe('interrupting');

      v_361415 = { type: 'speech_start', ts: Date.now() };
      v_be73a0(() => { v_2726cb({ signal: v_361415 }); });
      v_361415 = { type: 'speech_end', ts: Date.now() + 10 };
      v_be73a0(() => { v_2726cb({ signal: v_361415 }); });
      expect(v_43c42e.current.phase).toBe('listening');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[1]); });
      expect(v_a1d9db).toHaveBeenCalledTimes(2);
      expect(v_3e2c87).not.toHaveBeenCalled(); 
      expect(v_43c42e.current.phase).toBe('listening');
    } finally {
      jest.useRealTimers();
    }
  });

  it('[Important 1] signalGating 중 interrupting phase에서 dc 신호가 유실되면 responseDoneTimeoutMs 후 강제 listening 복귀한다', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      const v_a1d9db = jest.fn().mockResolvedValue(undefined);
      const { result: v_43c42e } = v_d84520({
        enabled: true,
        say: v_3e2c87,
        speak: v_a1d9db,
        getStatsReport: () => null,
        notifySpeechEnd: jest.fn(),
        speechEngine: v_1e3df0,
        signalGating: true,
      });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_43c42e.current.phase).toBe('listening');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[0]); });
      expect(v_a1d9db).toHaveBeenCalledWith(v_de0ee8);
      expect(v_43c42e.current.phase).toBe('interrupting');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(45000); });
      expect(v_43c42e.current.phase).toBe('listening');
    } finally {
      jest.useRealTimers();
    }
  });

  it('[Important 2] interim 없이 곧장 isFinal만 오는 STT(OEM 케이스)에서도 사용자 발화 중엔 워치독이 안 걸린다', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      const v_a1d9db = jest.fn().mockResolvedValue(undefined);
      const { result: v_43c42e } = v_d84520({
        enabled: true,
        say: v_3e2c87,
        speak: v_a1d9db,
        getStatsReport: () => null,
        notifySpeechEnd: jest.fn(),
        speechEngine: v_1e3df0,

        silenceMs: 40000,
      });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_43c42e.current.phase).toBe('listening');

      v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: true }); });
      expect(v_43c42e.current.interimTranscript).toBe('');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[0]); });

      expect(v_a1d9db).not.toHaveBeenCalledWith(v_de0ee8);
      expect(v_3e2c87).not.toHaveBeenCalledWith(v_de0ee8);
      expect(v_43c42e.current.phase).toBe('listening');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('T-258 최종 리뷰 fix: 계층 경계 회귀', () => {
  const v_17bd78 = '누구시죠?';

  const v_14bf2b = 60000;

  it('🔴[C1] 얼굴 인터럽트는 speak(고정 문구) 경로로 나간다 — say(LLM 턴)로 보내면 안 된다', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      const v_a1d9db = jest.fn().mockResolvedValue(undefined);
      const { result: v_43c42e } = v_d84520({
        enabled: true, say: v_3e2c87, speak: v_a1d9db,
        getStatsReport: () => null, notifySpeechEnd: jest.fn(), speechEngine: v_1e3df0,
      });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_43c42e.current.phase).toBe('listening');

      v_be73a0(() => { v_43c42e.current.notifyFaceInterrupt(v_17bd78, 'f1'); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });

      expect(v_a1d9db).toHaveBeenCalledWith(v_17bd78);
      expect(v_3e2c87).not.toHaveBeenCalled();
      expect(v_43c42e.current.phase).toBe('interrupting');
    } finally {
      jest.useRealTimers();
    }
  });

  it('🔴[C2] 에코 억제로 STT 가 끊겨 final 이 유실돼도 userSpeaking 이 고착되지 않는다(워치독 부활)', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      const v_a1d9db = jest.fn().mockResolvedValue(undefined);
      let v_fbe91e = 0.01;
      const { result: v_43c42e } = v_d84520({
        enabled: true, say: v_3e2c87, speak: v_a1d9db,
        getStatsReport: () => v_cde30b(v_fbe91e),
        notifySpeechEnd: jest.fn(), speechEngine: v_1e3df0,
        silenceMs: v_14bf2b, 
      });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_43c42e.current.phase).toBe('listening');

      v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '어' }], isFinal: false }); });

      v_fbe91e = 0.9;
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(600); });
      expect(v_43c42e.current.cloneSuppressed).toBe(true);

      v_fbe91e = 0.01;
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1200); });
      expect(v_43c42e.current.cloneSuppressed).toBe(false);

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_6fc7ac[0]); });
      expect(v_a1d9db).toHaveBeenCalledWith(v_de0ee8);
    } finally {
      jest.useRealTimers();
    }
  });

  async function v_740b2a(v_d06454) {
    const v_1e3df0 = v_c2295a();
    const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
    const v_a1d9db = jest.fn().mockResolvedValue(undefined);
    let v_fbe91e = 0.01;
    const { result: v_43c42e } = v_d84520({
      enabled: true, say: v_3e2c87, speak: v_a1d9db,
      getStatsReport: () => v_cde30b(v_fbe91e),
      notifySpeechEnd: jest.fn(), speechEngine: v_1e3df0,
      silenceMs: v_14bf2b,
    });
    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });

    v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '어' }], isFinal: false }); });
    v_be73a0(() => { v_43c42e.current.notifyFaceInterrupt(v_17bd78, 'f1'); });
    expect(v_a1d9db).not.toHaveBeenCalled();
    expect(v_43c42e.current.phase).toBe('listening');

    if (v_d06454 > 0) await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_d06454); });

    v_fbe91e = 0.9;
    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(600); });
    v_fbe91e = 0.01;
    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1200); });

    await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_778702); });
    return { result: v_43c42e, say: v_3e2c87, speak: v_a1d9db };
  }

  it('🔴[C3] 턴 종료 이벤트가 없어도(final 유실) 조용해지면 적재 인터럽트가 발화된다', async () => {
    jest.useFakeTimers();
    try {
      const { result: v_43c42e, speak: v_a1d9db, say: v_3e2c87 } = await v_740b2a(0);
      expect(v_a1d9db).toHaveBeenCalledWith(v_17bd78);
      expect(v_3e2c87).not.toHaveBeenCalled();
      expect(v_43c42e.current.phase).toBe('interrupting');
    } finally {
      jest.useRealTimers();
    }
  });

  it('🔴[C3] 적재 후 PENDING_INTERRUPT_EXPIRE_MS 를 넘기면 폐기된다(뒤늦은 인사 방지)', async () => {
    jest.useFakeTimers();
    try {
      const { result: v_43c42e, speak: v_a1d9db } = await v_740b2a(v_3711bb);
      expect(v_a1d9db).not.toHaveBeenCalled();
      expect(v_43c42e.current.phase).toBe('listening');
    } finally {
      jest.useRealTimers();
    }
  });

  it('🔴[I2] 클론 발화 재생 중 MIC_ON 은 STT 를 열지 않고, 그 발화가 끝난 뒤에만 마이크가 열린다', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
      let v_361415 = null;
      const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
        (v_b1927c) => v_7df8a4({
          enabled: true,
          say: v_3e2c87,
          speak: jest.fn().mockResolvedValue(undefined),
          getStatsReport: () => null,
          notifySpeechEnd: jest.fn(),
          speechEngine: v_1e3df0,
          lastSignal: v_b1927c.signal,
          silenceMs: 20, 
        }),
        { initialProps: { signal: v_361415 } },
      );
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });

      v_be73a0(() => { v_1e3df0.emitFinal('안녕'); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(50); });
      expect(v_3e2c87).toHaveBeenCalledWith('안녕');
      v_361415 = { type: 'speech_start', ts: 1 };
      v_be73a0(() => { v_2726cb({ signal: v_361415 }); });
      expect(v_43c42e.current.phase).toBe('speaking');

      v_be73a0(() => { v_43c42e.current.toggleMic(); });
      expect(v_43c42e.current.phase).toBe('paused');
      const v_6147e1 = v_1e3df0.start.mock.calls.length;
      v_be73a0(() => { v_43c42e.current.toggleMic(); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(400); }); 
      expect(v_43c42e.current.micOn).toBe(true);
      expect(v_43c42e.current.phase).toBe('speaking');
      expect(v_1e3df0.start.mock.calls.length).toBe(v_6147e1); 

      v_361415 = { type: 'speech_end', ts: 2 };
      v_be73a0(() => { v_2726cb({ signal: v_361415 }); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_43c42e.current.phase).toBe('listening');
      expect(v_1e3df0.start.mock.calls.length).toBeGreaterThan(v_6147e1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('🔴[I3] 인터럽트 발화 직후 쿨다운 동안 신규 얼굴 인터럽트를 무시한다(연쇄 상한)', async () => {
    jest.useFakeTimers();
    try {
      const v_1e3df0 = v_c2295a();
      const v_a1d9db = jest.fn().mockResolvedValue(undefined);
      let v_361415 = null;
      const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
        (v_b1927c) => v_7df8a4({
          enabled: true,
          say: jest.fn().mockResolvedValue(undefined),
          speak: v_a1d9db,
          getStatsReport: () => null,
          notifySpeechEnd: jest.fn(),
          speechEngine: v_1e3df0,
          lastSignal: v_b1927c.signal,
        }),
        { initialProps: { signal: v_361415 } },
      );
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });

      v_be73a0(() => { v_43c42e.current.notifyFaceInterrupt('첫 얼굴', 'f1'); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_a1d9db).toHaveBeenCalledTimes(1);
      v_361415 = { type: 'speech_start', ts: 1 };
      v_be73a0(() => { v_2726cb({ signal: v_361415 }); });
      v_361415 = { type: 'speech_end', ts: 2 };
      v_be73a0(() => { v_2726cb({ signal: v_361415 }); });
      expect(v_43c42e.current.phase).toBe('listening');

      v_be73a0(() => { v_43c42e.current.notifyFaceInterrupt('둘째 얼굴', 'f2'); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_778702 + 500); });
      expect(v_a1d9db).toHaveBeenCalledTimes(1);
      expect(v_43c42e.current.phase).toBe('listening');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(v_99c713); });
      v_be73a0(() => { v_43c42e.current.notifyFaceInterrupt('셋째 얼굴', 'f3'); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(0); });
      expect(v_a1d9db).toHaveBeenCalledTimes(2);
      expect(v_a1d9db).toHaveBeenLastCalledWith('셋째 얼굴');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('AFL-1008: 게이팅 중 감지기 RESPONSE_END 가 꼬리 대기를 지우지 않는다', () => {
  it('speech_end(remainingMs) 뒤 감지기가 먼저 끝나도 봉인 해제 후 listening 으로 돌아온다', async () => {

    jest.useFakeTimers();
    const v_1e3df0 = v_c2295a();
    let v_fbe91e = 0.9;
    const v_791152 = jest.fn(() => v_cde30b(v_fbe91e));
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
      (v_b1927c) => v_7df8a4({
        enabled: true,
        say: jest.fn().mockResolvedValue(undefined),
        notifySpeechEnd: jest.fn(),
        speechEngine: v_1e3df0,
        signalGating: true,
        silenceMs: 20,
        getStatsReport: v_791152,
        lastSignal: v_b1927c.signal,
      }),
      { initialProps: { signal: null as any } },
    );
    try {
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(100); });
      expect(v_43c42e.current.phase).toBe('listening');

      v_be73a0(() => { v_1e3df0.emitFinal('그랬구나'); });
      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(100); });
      expect(v_43c42e.current.phase).toBe('sending');

      v_2726cb({ signal: { type: 'speech_start', seq: 1, ts: 1 } });

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1000); });
      expect(v_43c42e.current.phase).toBe('speaking');

      v_2726cb({ signal: { type: 'speech_end', seq: 1, ts: 2, remainingMs: 3000 } });
      v_fbe91e = 0;

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1600); });
      expect(v_43c42e.current.phase).toBe('speaking');

      await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(2000); });
      expect(v_43c42e.current.phase).toBe('listening');
    } finally {
      jest.useRealTimers();
    }
  });
});
