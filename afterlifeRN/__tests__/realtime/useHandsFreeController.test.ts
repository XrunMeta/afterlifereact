import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_7df8a4 } from '../../src/realtime/useHandsFreeController';

function v_c2295a() {
  const v_9fde29 = {};
  return {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    start: jest.fn(),
    stop: jest.fn(),
    addListener: (v_1d299c, v_16dbdb) => {
      (v_9fde29[v_1d299c] ||= []).push(v_16dbdb);
      return { remove: () => {} };
    },
    emit: (v_1d299c, v_e2a85c) => (v_9fde29[v_1d299c] || []).forEach((v_16dbdb) => v_16dbdb(v_e2a85c)),
  };
}

it('enabled=true → STT 시작(listening)', async () => {
  const v_1e3df0 = v_c2295a();
  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const { result: v_43c42e } = v_0da18b(() =>
    v_7df8a4({
      enabled: true,
      say: v_3e2c87,
      getStatsReport: () => null,
      notifySpeechEnd: jest.fn(),
      speechEngine: v_1e3df0,
    }),
  );
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  expect(v_43c42e.current.phase).toBe('listening');
});

it('STT final → 침묵 debounce 후 say 호출 + speaking 전환', async () => {
  const v_1e3df0 = v_c2295a();
  const v_3e2c87 = jest.fn().mockResolvedValue(undefined);
  const { result: v_43c42e } = v_0da18b(() =>
    v_7df8a4({
      enabled: true,
      say: v_3e2c87,
      getStatsReport: () => null,
      notifySpeechEnd: jest.fn(),
      speechEngine: v_1e3df0,
      silenceMs: 20, 
    }),
  );
  await v_81e49f(() => expect(v_1e3df0.start).toHaveBeenCalled());
  v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: true }); });

  await v_81e49f(() => expect(v_3e2c87).toHaveBeenCalledWith('안녕'));
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('speaking'));
  expect(v_1e3df0.stop).toHaveBeenCalled();
});

it('toggleMic: listening → paused(마이크 끔)', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() =>
    v_7df8a4({
      enabled: true,
      say: jest.fn().mockResolvedValue(undefined),
      getStatsReport: () => null,
      notifySpeechEnd: jest.fn(),
      speechEngine: v_1e3df0,
    }),
  );
  await v_81e49f(() => expect(v_43c42e.current.phase).toBe('listening'));
  v_be73a0(() => { v_43c42e.current.toggleMic(); });
  expect(v_43c42e.current.micOn).toBe(false);
  expect(v_43c42e.current.phase).toBe('paused');
});
