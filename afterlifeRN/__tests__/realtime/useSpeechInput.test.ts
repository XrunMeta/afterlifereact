import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import {
  v_fee12d,
  v_74fd06,
  v_4c6a50,
  v_3937db,
  v_4811dd,
  v_b90ee2,
  v_1d6b6a,
  v_7f5942,
} from '../../src/realtime/useSpeechInput';
import { v_08004c, v_8c24f4 } from '../../src/realtime/timingEvents';

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
  const { result: v_43c42e, rerender: v_2726cb } = v_0da18b(
    ({ eng: v_3be5d5 }: { eng: ReturnType<typeof v_c2295a> }) =>
      v_fee12d({ engine: v_3be5d5, onFinalResult: v_f28164, silenceMs: v_6d843a }),
    { initialProps: { eng: v_9ba3c9 } },
  );

  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

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

it('startListening 호출 후 start 이벤트 emit 전에는 listening=false', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));

  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  expect(v_43c42e.current.listening).toBe(false);
});

it('startListening 후 start 이벤트 emit → listening=true', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_43c42e.current.listening).toBe(false);
  v_be73a0(() => {
    v_1e3df0.emit('start');
  });
  expect(v_43c42e.current.listening).toBe(true);
});

it('startListening 후 워치독 만료(기본 1500ms)까지 start 이벤트 없으면 listening=false 유지', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  v_be73a0(() => { jest.advanceTimersByTime(1400); });
  expect(v_43c42e.current.listening).toBe(false);

  v_be73a0(() => { jest.advanceTimersByTime(200); });
  expect(v_43c42e.current.listening).toBe(false);
});

it('startListening 후 result 이벤트 도착 → listening=true(워치독 해제)', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });
  expect(v_43c42e.current.listening).toBe(true);
});

it('error 이벤트 → listening=false', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => {
    v_1e3df0.emit('start');
  });
  expect(v_43c42e.current.listening).toBe(true);
  v_be73a0(() => {
    v_1e3df0.emit('error', { message: 'network_error' });
  });
  expect(v_43c42e.current.listening).toBe(false);
});

it('end 자동재시작: start 이벤트 의존, 워치독 재무장', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(true);

  v_be73a0(() => { v_1e3df0.emit('end'); });
  expect(v_43c42e.current.listening).toBe(false);

  v_be73a0(() => { jest.advanceTimersByTime(400); });

  expect(v_43c42e.current.listening).toBe(false);

  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(true);
});

it('[B-1] startListening 진행 중(start 이벤트 미도착) 재호출 → engine.start 1회만', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  expect(v_1e3df0.start).toHaveBeenCalledTimes(1);
});

it('[B-1] startListening 후 start 이벤트 도착(확정) → 이후 재호출 허용', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(true);

  v_be73a0(() => { v_43c42e.current.stopListening(); });
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  expect(v_1e3df0.start).toHaveBeenCalledTimes(2);
});

it('[B-1] startListening 후 워치독 만료(확정 실패) → 이후 재호출 허용', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_1e3df0.start).toHaveBeenCalledTimes(1);

  v_be73a0(() => { jest.advanceTimersByTime(v_74fd06 + 10); });

  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_1e3df0.start).toHaveBeenCalledTimes(2);
});

it('[I-1] end 자동재시작 갭(listening=false 짧음) → stalled=false 유지(sttActive)', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() =>
    v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a })
  );
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(true);
  expect(v_43c42e.current.listeningDebounced).toBe(true);

  v_be73a0(() => { v_1e3df0.emit('end'); });
  expect(v_43c42e.current.listening).toBe(false);

  v_be73a0(() => { jest.advanceTimersByTime(1000); });
  expect(v_43c42e.current.listeningDebounced).toBe(true);
});

it('[I-1] STT 장시간 미기동(stalled) → STALLED_DEBOUNCE_MS 경과 후 listeningDebounced=false', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() =>
    v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a })
  );
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listeningDebounced).toBe(true);

  v_be73a0(() => { v_1e3df0.emit('end'); });

  v_be73a0(() => { jest.advanceTimersByTime(v_4c6a50 + 100); });
  expect(v_43c42e.current.listeningDebounced).toBe(false);
});

it('[MAJOR-1] STT_WATCHDOG_MS-1 시점에 start 없으면 listening=false 유지', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => { jest.advanceTimersByTime(v_74fd06 - 1); });
  expect(v_43c42e.current.listening).toBe(false);
});

it('[MAJOR-1] STT_WATCHDOG_MS 정확히 만료 → listening=false 유지', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => { jest.advanceTimersByTime(v_74fd06); });
  expect(v_43c42e.current.listening).toBe(false);
});

it('[MAJOR-1] STT_WATCHDOG_MS 만료 전 start 도착 → listening=true', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });

  v_be73a0(() => {
    jest.advanceTimersByTime(v_74fd06 - 1);
    v_1e3df0.emit('start');
  });
  expect(v_43c42e.current.listening).toBe(true);

  v_be73a0(() => { jest.advanceTimersByTime(10); });
  expect(v_43c42e.current.listening).toBe(true);
});

it('[MAJOR-2] iOS: start 이벤트 없이 result만 도착 → listening=true(워치독 해제)', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_43c42e.current.listening).toBe(false);

  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });

  expect(v_43c42e.current.listening).toBe(true);

  v_be73a0(() => { jest.advanceTimersByTime(v_74fd06 + 100); });
  expect(v_43c42e.current.listening).toBe(true);
});

it('[MINOR-1] end 재시작 후 start 미도착(워치독 만료) → listening=false 유지', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(true);

  v_be73a0(() => { v_1e3df0.emit('end'); });
  v_be73a0(() => { jest.advanceTimersByTime(400); });

  v_be73a0(() => { jest.advanceTimersByTime(v_74fd06 + 10); });
  expect(v_43c42e.current.listening).toBe(false);
});

it('[STOP-REOPEN] stopListening 후 늦게 도착한 result → listening=false 유지, onFinalResult 미호출', async () => {

  const v_1e3df0 = v_c2295a();
  const v_f28164 = jest.fn();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => { v_1e3df0.emit('start'); });
  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: false });
  });
  expect(v_43c42e.current.listening).toBe(true);

  v_be73a0(() => { v_43c42e.current.stopListening(); });
  expect(v_43c42e.current.listening).toBe(false);

  v_be73a0(() => {
    v_1e3df0.emit('result', { results: [{ transcript: '늦은잔여' }], isFinal: true });
  });
  expect(v_43c42e.current.listening).toBe(false);
  v_be73a0(() => {
    jest.advanceTimersByTime(v_6d843a + 20);
  });
  expect(v_43c42e.current.listening).toBe(false);
  expect(v_f28164).not.toHaveBeenCalled();
});

it('[STOP-REOPEN] stopListening 후 늦게 도착한 start 이벤트 → listening=false 유지', async () => {
  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(true);
  v_be73a0(() => { v_43c42e.current.stopListening(); });
  expect(v_43c42e.current.listening).toBe(false);

  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(false);
});

it('[STOP-REOPEN] stopListening 후 재차 startListening → 이어지는 result/start는 정상 확정(listening=true)', async () => {

  const v_1e3df0 = v_c2295a();
  const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(true);
  v_be73a0(() => { v_43c42e.current.stopListening(); });
  expect(v_43c42e.current.listening).toBe(false);

  await v_be73a0(async () => {
    await v_43c42e.current.startListening();
  });
  expect(v_43c42e.current.listening).toBe(false); 
  v_be73a0(() => { v_1e3df0.emit('start'); });
  expect(v_43c42e.current.listening).toBe(true);
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

describe('onSpeechActivity', () => {
  it('non-final(interim) result 수신 시 호출된다', async () => {
    const v_1e3df0 = v_c2295a();
    const v_dafc66 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onSpeechActivity: v_dafc66, silenceMs: v_6d843a }));
    await v_be73a0(async () => { await v_43c42e.current.startListening(); });

    v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '음' }], isFinal: false }); });
    expect(v_dafc66).toHaveBeenCalledTimes(1);
  });

  it('interim 없이 곧장 isFinal:true 만 오는 엔진에서도 호출된다(OEM 케이스)', async () => {

    const v_1e3df0 = v_c2295a();
    const v_dafc66 = jest.fn();
    const v_f28164 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_fee12d({ engine: v_1e3df0, onSpeechActivity: v_dafc66, onFinalResult: v_f28164, silenceMs: v_6d843a }));
    await v_be73a0(async () => { await v_43c42e.current.startListening(); });

    v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: true }); });
    expect(v_dafc66).toHaveBeenCalledTimes(1);
    expect(v_43c42e.current.interimTranscript).toBe(''); 

    v_be73a0(() => { jest.advanceTimersByTime(v_6d843a + 20); });
    expect(v_f28164).toHaveBeenCalledTimes(1);
    expect(v_f28164).toHaveBeenCalledWith('안녕');
  });

  it('stopListening 이후(want=false) 잔여 result 이벤트엔 호출되지 않는다', async () => {
    const v_1e3df0 = v_c2295a();
    const v_dafc66 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onSpeechActivity: v_dafc66, silenceMs: v_6d843a }));
    await v_be73a0(async () => { await v_43c42e.current.startListening(); });
    v_be73a0(() => { v_43c42e.current.stopListening(); });

    v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '늦은 응답' }], isFinal: true }); });
    expect(v_dafc66).not.toHaveBeenCalled();
  });

  it('미지정이어도(옵션 생략) 기존 동작에 영향 없음', async () => {
    const v_1e3df0 = v_c2295a();
    const v_f28164 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
    await v_be73a0(async () => { await v_43c42e.current.startListening(); });
    v_be73a0(() => { v_1e3df0.emit('result', { results: [{ transcript: '안녕' }], isFinal: true }); });
    v_be73a0(() => { jest.advanceTimersByTime(v_6d843a + 20); });
    expect(v_f28164).toHaveBeenCalledWith('안녕');
  });
});

describe('마이크 볼륨 기반 전송 유예', () => {
  async function v_9a4ebd() {
    const v_1e3df0 = v_c2295a();
    const v_f28164 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() => v_fee12d({ engine: v_1e3df0, onFinalResult: v_f28164, silenceMs: v_6d843a }));
    await v_be73a0(async () => {
      await v_43c42e.current.startListening();
    });
    v_be73a0(() => {
      v_1e3df0.emit('result', { results: [{ transcript: '저 지금' }], isFinal: false });
    });
    return { engine: v_1e3df0, onFinalResult: v_f28164 };
  }

  it('result 가 끊겨도 마이크가 시끄러우면 전송을 미루고, 조용해진 뒤 silenceMs 후 전송한다', async () => {
    const { engine: v_1e3df0, onFinalResult: v_f28164 } = await v_9a4ebd();

    for (let v_ebec57 = 0; v_ebec57 < 4; v_ebec57++) {
      v_be73a0(() => {
        jest.advanceTimersByTime(v_6d843a / 2);
        v_1e3df0.emit('volumechange', { value: v_3937db + 5 });
      });
    }
    expect(v_f28164).not.toHaveBeenCalled();

    v_be73a0(() => {
      v_1e3df0.emit('volumechange', { value: -1 });
      jest.advanceTimersByTime(v_6d843a + 10);
    });
    expect(v_f28164).toHaveBeenCalledWith('저 지금');
  });

  it('기준 미만 볼륨(무음 대역)은 전송을 미루지 않는다', async () => {
    const { engine: v_1e3df0, onFinalResult: v_f28164 } = await v_9a4ebd();
    v_be73a0(() => {
      v_1e3df0.emit('volumechange', { value: v_3937db - 1 });
      jest.advanceTimersByTime(v_6d843a + 10);
    });
    expect(v_f28164).toHaveBeenCalledWith('저 지금');
  });

  it('소음으로 볼륨이 계속 커도 VOICE_HOLD_MAX_MS 를 넘기면 전송한다', async () => {
    const { engine: v_1e3df0, onFinalResult: v_f28164 } = await v_9a4ebd();
    const v_eb271c = Math.ceil((v_4811dd + v_6d843a * 2) / (v_6d843a / 2));
    for (let v_ebec57 = 0; v_ebec57 < v_eb271c && v_f28164.mock.calls.length === 0; v_ebec57++) {
      v_be73a0(() => {
        v_1e3df0.emit('volumechange', { value: v_3937db + 5 });
        jest.advanceTimersByTime(v_6d843a / 2);
      });
    }
    expect(v_f28164).toHaveBeenCalledWith('저 지금');
  });
});

describe('STT error 재시작', () => {
  async function v_4c6dd7() {
    const v_1e3df0 = v_c2295a();
    const v_ae701f = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a }));
    await v_be73a0(async () => { await v_ae701f.result.current.startListening(); });
    v_be73a0(() => { v_1e3df0.emit('start'); });
    return { engine: v_1e3df0, hook: v_ae701f };
  }

  it('듣기 중 error(end 없음) → 재시작 + stt_engine 로그', async () => {
    v_8c24f4();
    const { engine: v_1e3df0 } = await v_4c6dd7();
    expect(v_1e3df0.start).toHaveBeenCalledTimes(1);
    v_be73a0(() => { v_1e3df0.emit('error', { error: 'audio-capture', message: 'busy' }); });
    v_be73a0(() => { jest.advanceTimersByTime(v_1d6b6a); });
    expect(v_1e3df0.start).toHaveBeenCalledTimes(2);
    const v_7866ae = v_08004c().filter((v_9e86fd) => v_9e86fd.type === 'stt_engine').map((v_9e86fd) => (v_9e86fd.detail as any).ev);
    expect(v_7866ae).toEqual(expect.arrayContaining(['start', 'error', 'restart']));
  });

  it('error 다음 end 가 와도 start 는 한 번만', async () => {
    const { engine: v_1e3df0 } = await v_4c6dd7();
    v_be73a0(() => { v_1e3df0.emit('error', { error: 'no-speech' }); v_1e3df0.emit('end'); });
    v_be73a0(() => { jest.advanceTimersByTime(v_1d6b6a + 500); });
    expect(v_1e3df0.start).toHaveBeenCalledTimes(2);
  });

  it('권한 오류는 재시작하지 않는다', async () => {
    const { engine: v_1e3df0 } = await v_4c6dd7();
    v_be73a0(() => { v_1e3df0.emit('error', { error: 'not-allowed' }); });
    v_be73a0(() => { jest.advanceTimersByTime(v_1d6b6a * 2); });
    expect(v_1e3df0.start).toHaveBeenCalledTimes(1);
  });

  it('stopListening 뒤의 error 는 재시작하지 않는다', async () => {
    const { engine: v_1e3df0, hook: v_ae701f } = await v_4c6dd7();
    v_be73a0(() => { v_ae701f.result.current.stopListening(); });
    v_be73a0(() => { v_1e3df0.emit('error', { error: 'aborted' }); });
    v_be73a0(() => { jest.advanceTimersByTime(v_1d6b6a * 2); });
    expect(v_1e3df0.start).toHaveBeenCalledTimes(1);
  });

  it('연속 error 재시작은 상한까지 — result 가 오면 다시 센다', async () => {
    const { engine: v_1e3df0 } = await v_4c6dd7();
    for (let v_ebec57 = 0; v_ebec57 < v_b90ee2 + 2; v_ebec57++) {
      v_be73a0(() => { v_1e3df0.emit('error', { error: 'audio' }); });
      v_be73a0(() => { jest.advanceTimersByTime(v_1d6b6a); });
      v_be73a0(() => { v_1e3df0.emit('start'); });
    }
    expect(v_1e3df0.start).toHaveBeenCalledTimes(1 + v_b90ee2);
    v_be73a0(() => { v_1e3df0.emit('result', { isFinal: false, results: [{ transcript: '안녕' }] }); });
    v_be73a0(() => { v_1e3df0.emit('error', { error: 'audio' }); });
    v_be73a0(() => { jest.advanceTimersByTime(v_1d6b6a); });
    expect(v_1e3df0.start).toHaveBeenCalledTimes(2 + v_b90ee2);
  });
});

describe('STT network 백오프', () => {
  async function v_4c6dd7(v_540cc7 = jest.fn()) {
    const v_1e3df0 = v_c2295a();
    const v_ae701f = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a, onUnrecoverable: v_540cc7 }));
    await v_be73a0(async () => { await v_ae701f.result.current.startListening(); });
    v_be73a0(() => { v_1e3df0.emit('start'); });
    return { engine: v_1e3df0, hook: v_ae701f, onUnrecoverable: v_540cc7 };
  }
  const v_d1e7e0 = (v_1e3df0) => v_be73a0(() => {
    v_1e3df0.emit('error', { error: 'network', message: 'Server disconnected.' });
    v_1e3df0.emit('end');
  });

  it('오류 즉시 recovering=true(녹색 끔) → 엔진이 다시 start 하면 false', async () => {
    const { engine: v_1e3df0, hook: v_ae701f } = await v_4c6dd7();
    expect(v_ae701f.result.current.recovering).toBe(false);
    v_d1e7e0(v_1e3df0);
    expect(v_ae701f.result.current.recovering).toBe(true);
    expect(v_ae701f.result.current.listeningDebounced).toBe(true); 
    v_be73a0(() => { jest.advanceTimersByTime(v_7f5942[0]); });
    v_be73a0(() => { v_1e3df0.emit('start'); });
    expect(v_ae701f.result.current.recovering).toBe(false);
  });

  it('stopListening 은 recovering 을 끈다', async () => {
    const { engine: v_1e3df0, hook: v_ae701f } = await v_4c6dd7();
    v_d1e7e0(v_1e3df0);
    v_be73a0(() => { v_ae701f.result.current.stopListening(); });
    expect(v_ae701f.result.current.recovering).toBe(false);
  });

  it('간격을 1·2·4·8초로 벌린다 — end 의 0.4초 재시작이 끼어들지 않는다', async () => {
    const { engine: v_1e3df0 } = await v_4c6dd7();
    let v_20e160 = 1;
    for (const v_d799e2 of v_7f5942) {
      v_d1e7e0(v_1e3df0);
      v_be73a0(() => { jest.advanceTimersByTime(v_d799e2 - 1); });
      expect(v_1e3df0.start).toHaveBeenCalledTimes(v_20e160);          
      v_be73a0(() => { jest.advanceTimersByTime(1); });
      v_20e160 += 1;
      expect(v_1e3df0.start).toHaveBeenCalledTimes(v_20e160);
      v_be73a0(() => { v_1e3df0.emit('start'); });
    }
  });

  it('8초 뒤 시도까지 실패하면 포기 — onUnrecoverable 1회, 더 붙지 않는다', async () => {
    const { engine: v_1e3df0, onUnrecoverable: v_540cc7 } = await v_4c6dd7();
    for (const v_d799e2 of v_7f5942) {
      v_d1e7e0(v_1e3df0);
      v_be73a0(() => { jest.advanceTimersByTime(v_d799e2); });
      v_be73a0(() => { v_1e3df0.emit('start'); });
    }
    const v_e98932 = v_1e3df0.start.mock.calls.length;
    v_d1e7e0(v_1e3df0);
    v_be73a0(() => { jest.advanceTimersByTime(20000); });
    expect(v_540cc7).toHaveBeenCalledTimes(1);
    expect(v_540cc7).toHaveBeenCalledWith('network');
    expect(v_1e3df0.start).toHaveBeenCalledTimes(v_e98932);
  });

  it('인식 결과가 오면(서버 회복) 백오프가 처음부터 다시 센다', async () => {
    const { engine: v_1e3df0, onUnrecoverable: v_540cc7 } = await v_4c6dd7();
    v_d1e7e0(v_1e3df0); v_be73a0(() => { jest.advanceTimersByTime(1000); });
    v_d1e7e0(v_1e3df0); v_be73a0(() => { jest.advanceTimersByTime(2000); });
    v_be73a0(() => { v_1e3df0.emit('result', { isFinal: false, results: [{ transcript: '안녕' }] }); });
    const v_e98932 = v_1e3df0.start.mock.calls.length;
    v_d1e7e0(v_1e3df0);
    v_be73a0(() => { jest.advanceTimersByTime(1000); });            
    expect(v_1e3df0.start).toHaveBeenCalledTimes(v_e98932 + 1);
    expect(v_540cc7).not.toHaveBeenCalled();
  });
});

describe('STT network 백오프 — self-heal 폴링 아래에서도', () => {
  it('대기 중 startListening 은 무시되고 1·2·4·8초 뒤 포기까지 간다', async () => {
    const v_1e3df0 = v_c2295a();
    const v_540cc7 = jest.fn();
    const v_ae701f = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a, onUnrecoverable: v_540cc7 }));
    await v_be73a0(async () => { await v_ae701f.result.current.startListening(); });
    v_be73a0(() => { v_1e3df0.emit('start'); });
    const v_16badd = async (v_d799e2) => {
      for (let v_8d41d7 = 0; v_8d41d7 < v_d799e2; v_8d41d7 += 200) {
        await v_be73a0(async () => { await v_ae701f.result.current.startListening(); });
        v_be73a0(() => { jest.advanceTimersByTime(200); });
      }
    };
    const v_9c716c = [];
    for (const v_d799e2 of v_7f5942) {
      const v_e98932 = v_1e3df0.start.mock.calls.length;
      v_be73a0(() => { v_1e3df0.emit('error', { error: 'network' }); v_1e3df0.emit('end'); });
      await v_16badd(v_d799e2 - 200);
      expect(v_1e3df0.start).toHaveBeenCalledTimes(v_e98932);      
      await v_16badd(400);
      v_9c716c.push(v_1e3df0.start.mock.calls.length - v_e98932);
      v_be73a0(() => { v_1e3df0.emit('start'); });
    }
    expect(v_9c716c).toEqual([1, 1, 1, 1]);
    v_be73a0(() => { v_1e3df0.emit('error', { error: 'network' }); v_1e3df0.emit('end'); });
    expect(v_540cc7).toHaveBeenCalledWith('network');
  });

  it('stopListening(턴 넘김·통화 종료) 뒤 새 듣기는 백오프를 처음부터', async () => {
    const v_1e3df0 = v_c2295a();
    const v_540cc7 = jest.fn();
    const v_ae701f = v_0da18b(() => v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a, onUnrecoverable: v_540cc7 }));
    await v_be73a0(async () => { await v_ae701f.result.current.startListening(); });
    v_be73a0(() => { v_1e3df0.emit('start'); });
    for (const v_d799e2 of v_7f5942.slice(0, 3)) {
      v_be73a0(() => { v_1e3df0.emit('error', { error: 'network' }); v_1e3df0.emit('end'); });
      v_be73a0(() => { jest.advanceTimersByTime(v_d799e2); });
      v_be73a0(() => { v_1e3df0.emit('start'); });
    }
    v_be73a0(() => { v_ae701f.result.current.stopListening(); });
    await v_be73a0(async () => { await v_ae701f.result.current.startListening(); });
    v_be73a0(() => { v_1e3df0.emit('start'); });
    const v_e98932 = v_1e3df0.start.mock.calls.length;
    v_be73a0(() => { v_1e3df0.emit('error', { error: 'network' }); v_1e3df0.emit('end'); });
    v_be73a0(() => { jest.advanceTimersByTime(v_7f5942[0]); });
    expect(v_1e3df0.start).toHaveBeenCalledTimes(v_e98932 + 1);    
    expect(v_540cc7).not.toHaveBeenCalled();
  });
});

describe('이어질 모양 endpoint 연장', () => {
  const v_953766 = 300;
  async function v_a1d9db(v_9b6134) {
    const v_1e3df0 = v_c2295a();
    const v_f28164 = jest.fn();
    const v_ae701f = v_0da18b(() =>
      v_fee12d({ engine: v_1e3df0, silenceMs: v_6d843a, incompleteHoldMs: v_953766, onFinalResult: v_f28164 }));
    await v_be73a0(async () => { await v_ae701f.result.current.startListening(); });
    v_be73a0(() => { v_1e3df0.emit('start'); });
    v_be73a0(() => { v_1e3df0.emit('result', { isFinal: true, results: [{ transcript: v_9b6134 }] }); });
    return { engine: v_1e3df0, onFinalResult: v_f28164 };
  }

  it('"특별한 일은" 은 silenceMs 에 보내지 않고 HOLD 까지 기다린다', async () => {
    const { onFinalResult: v_f28164 } = await v_a1d9db('특별한 일은');
    v_be73a0(() => { jest.advanceTimersByTime(v_6d843a + 10); });
    expect(v_f28164).not.toHaveBeenCalled();
    v_be73a0(() => { jest.advanceTimersByTime(v_953766); });
    expect(v_f28164).toHaveBeenCalledWith('특별한 일은');
  });

  it('기다리는 동안 이어서 말하면 합쳐서 한 번에 보낸다', async () => {
    const { engine: v_1e3df0, onFinalResult: v_f28164 } = await v_a1d9db('어 지금은 좀');
    v_be73a0(() => { jest.advanceTimersByTime(v_6d843a + 100); });
    v_be73a0(() => { v_1e3df0.emit('result', { isFinal: true, results: [{ transcript: '그냥 쉬고 있는 중이야' }] }); });
    v_be73a0(() => { jest.advanceTimersByTime(v_6d843a + 10); });
    expect(v_f28164).toHaveBeenCalledTimes(1);
    expect(v_f28164).toHaveBeenCalledWith('어 지금은 좀 그냥 쉬고 있는 중이야');
  });

  it('끝난 모양이면 기존처럼 silenceMs 에 보낸다', async () => {
    const { onFinalResult: v_f28164 } = await v_a1d9db('그래 알았다');
    v_be73a0(() => { jest.advanceTimersByTime(v_6d843a + 10); });
    expect(v_f28164).toHaveBeenCalledWith('그래 알았다');
  });
});
