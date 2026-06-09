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

const v_6d843a = 50;

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

it('권한 허용 → start(continuous,interimResults) 호출', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_1e3df0.start).toHaveBeenCalled();
  const v_328259 = v_1e3df0.start.mock.calls[0][0];
  expect(v_328259.interimResults).toBe(true);
  expect(v_328259.continuous).toBe(true);
});

it('권한 거부 → error, start 미호출', async () => {
  const v_1e3df0 = v_c2295a();
  v_1e3df0.requestPermissionsAsync.mockResolvedValue({ granted: false });
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_1e3df0.start).not.toHaveBeenCalled();
  expect(v_43c42e.current.error).toBeTruthy();
});

it('stopListening → engine.stop, 대기 중 debounce 취소(미전송)', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });

  v_be73a0(() => {
    v_43c42e.current.stopListening();
  });
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  expect(v_1e3df0.stop).toHaveBeenCalled();
  expect(v_f28164).not.toHaveBeenCalled();
});

it('발화 중 멈칫(침묵<debounce)에 새 result → 타이머 리셋, 미전송', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });

  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a - 10);
  });

  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕하세요 반갑습니다' }], isFinal: false });
  });
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a - 10);
  });

  expect(v_f28164).not.toHaveBeenCalled();
});

it('발화 종료 후 침묵 debounce 경과 → 누적 텍스트 1회 전송', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });
  await v_81e49f(() => expect(v_43c42e.current.interimTranscript || v_43c42e.current.transcript).toBeTruthy());
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  expect(v_f28164).toHaveBeenCalledTimes(1);
  expect(v_f28164).toHaveBeenCalledWith('안녕하세요');
});

it('continuous 다중 세그먼트(final 여러 번) → 침묵 후 합쳐서 1회 전송', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
    v_1e3df0.emit('result', { results: [{ transcript: '오늘 날씨 좋네요' }], isFinal: true });
  });
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  expect(v_f28164).toHaveBeenCalledTimes(1);
  expect(v_f28164).toHaveBeenCalledWith('안녕하세요 오늘 날씨 좋네요');
});

it('동일 세그먼트 재emit → 중복 누적 안 함', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
    v_1e3df0.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  expect(v_f28164).toHaveBeenCalledWith('안녕하세요');
});

it('공백만 누적 → 침묵 후에도 onFinalResult 미호출', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '   ' }], isFinal: true });
  });
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  expect(v_f28164).not.toHaveBeenCalled();
});

it('engine 재등록(리렌더로 effect 재실행) 중에도 진행 중 침묵 타이머가 살아남아 flush', async () => {

  const v_9ba3c9 = v_c2295a();
  const v_85f11a = v_c2295a();
  const v_f28164 = jest.fn();
  const { rerender: v_2726cb } = v_0da18b(
    ({ eng: v_3be5d5 }: { eng: ReturnType<typeof v_c2295a> }) =>
      v_fee12d({ engine: v_3be5d5, onFinalResult: v_f28164, silenceMs: v_6d843a }),
    { initialProps: { eng: v_9ba3c9 } },
  );

  v_be73a0(() => {
    v_9ba3c9.emit('result', { results: [{ transcript: '안녕하세요' }], isFinal: true });
  });

  v_be73a0(() => {
    v_2726cb({ eng: v_85f11a });
  });

  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  expect(v_f28164).toHaveBeenCalledWith('안녕하세요');
});

it('전송 후 누적 리셋 → 다음 발화는 이전 텍스트 안 섞임', async () => {
  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '첫번째' }], isFinal: true });
  });
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '두번째' }], isFinal: true });
  });
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  expect(v_f28164).toHaveBeenNthCalledWith(1, '첫번째');
  expect(v_f28164).toHaveBeenNthCalledWith(2, '두번째');
});
