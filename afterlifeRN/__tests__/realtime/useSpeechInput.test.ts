import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_fee12d } from '../../src/realtime/useSpeechInput';

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

it('권한 허용 → start → result 이벤트(isFinal=true) → transcript 반환', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0 }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_1e3df0.start).toHaveBeenCalled();
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });
  await v_81e49f(() => expect(v_43c42e.current.transcript).toBe('안녕하세요'));
});

it('권한 거부 → error, start 미호출', async () => {
  const v_1e3df0 = v_c2295a();
  v_1e3df0.requestPermissionsAsync.mockResolvedValue({ granted: false });
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0 }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_1e3df0.start).not.toHaveBeenCalled();
  expect(v_43c42e.current.error).toBeTruthy();
});

it('stopListening → engine.stop', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0 }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_43c42e.current.stopListening();
  });
  expect(v_1e3df0.stop).toHaveBeenCalled();
});

it('interim 여러 번 → isFinal=true 에서만 onFinalResult 1회 호출(최종 텍스트)', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164 }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {

    v_1e3df0.emit('result', { results: [{ transcript: '안' }], isFinal: false });
    v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });
  expect(v_f28164).not.toHaveBeenCalled();

  await v_81e49f(() => expect(v_43c42e.current.interimTranscript).toBe('안녕'));
  v_be73a0(() => {

    v_1e3df0.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });
  await v_81e49f(() => expect(v_43c42e.current.transcript).toBe('안녕하세요'));
  expect(v_f28164).toHaveBeenCalledTimes(1);
  expect(v_f28164).toHaveBeenCalledWith('안녕하세요');
});

it('공백만인 final → onFinalResult 미호출', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164 }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '   ' }], isFinal: true });
  });
  await v_81e49f(() => expect(v_43c42e.current.transcript).toBe('   '));
  expect(v_f28164).not.toHaveBeenCalled();
});
