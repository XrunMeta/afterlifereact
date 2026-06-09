import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_7df8a4 } from '../../src/realtime/useHandsFreeController';

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

it('subscribeSpeechEnd 콜백 발화 → sending이면 listening 복귀(서버 신호)', async () => {
  let v_0100e1 = () => {};
  const v_f1f010 = (v_16dbdb) => { v_0100e1 = v_16dbdb; return () => {}; };
  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true, say: v_3e2c87, speechEngine: v_1e3df0, silenceMs: 20, confirmMs: 50,
    getStatsReport: () => null, notifySpeechEnd: () => {}, subscribeSpeechEnd: v_f1f010,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  jest.useFakeTimers();
  try {

    v_be73a0(() => { v_1e3df0.emitFinal('안녕'); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('confirming'));
    v_be73a0(() => { jest.advanceTimersByTime(50); });
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('sending'));

    v_be73a0(() => v_0100e1());
    await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  } finally {
    jest.useRealTimers();
  }
});

it('subscribeSpeechEnd 콜백이 listening 중 발화되면 무시', async () => {
  let v_0100e1 = () => {};
  const v_f1f010 = (v_16dbdb) => { v_0100e1 = v_16dbdb; return () => {}; };
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_d84520({
    enabled: true, say: jest.fn().mockResolvedValue(undefined), speechEngine: v_1e3df0,
    getStatsReport: () => null, notifySpeechEnd: () => {}, subscribeSpeechEnd: v_f1f010,
  });
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));

  v_be73a0(() => { v_0100e1(); });
  await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, 10));
  expect(v_43c42e.current.phase).toBe('listening');
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

it('언마운트 → subscribeSpeechEnd 구독 해제 호출', async () => {
  const v_69c966 = jest.fn();
  const v_f1f010 = (v_d6694c) => v_69c966;
  const v_1e3df0 = v_c2295a();
  const { unmount: v_67a0e6 } = v_d84520({
    enabled: true,
    say: jest.fn().mockResolvedValue(undefined),
    speechEngine: v_1e3df0,
    getStatsReport: () => null,
    notifySpeechEnd: () => {},
    subscribeSpeechEnd: v_f1f010,
  });
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  v_67a0e6();
  expect(v_69c966).toHaveBeenCalled();
});
