import { v_0da18b, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_724dd4 } from '../../src/realtime/useCloneSilenceDetector';

function v_15fd85(v_fbe91e) {
  const v_62676b = [
    ['v', { type: 'inbound-rtp', kind: 'video' }],
  ];
  if (v_fbe91e !== undefined) v_62676b.push(['a', { type: 'inbound-rtp', kind: 'audio', audioLevel: v_fbe91e }]);
  return v_62676b;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

it('소리 → 무음 1.2s 지속 → onResponseEnd 1회', async () => {
  let v_fbe91e = 0.5;
  const v_dfd959 = jest.fn();
  const v_791152 = jest.fn(() => Promise.resolve(v_15fd85(v_fbe91e)));
  const { result: v_43c42e } = v_0da18b(() =>
    v_724dd4({ getStatsReport: v_791152, onResponseEnd: v_dfd959 }),
  );
  v_be73a0(() => { v_43c42e.current.start(); });
  await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(200); });
  v_fbe91e = 0.0;
  await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1400); });
  expect(v_dfd959).toHaveBeenCalledTimes(1);
});

it('stop() 후에는 콜백 안 옴', async () => {
  const v_dfd959 = jest.fn();
  const v_791152 = jest.fn(() => Promise.resolve(v_15fd85(0.0)));
  const { result: v_43c42e } = v_0da18b(() =>
    v_724dd4({ getStatsReport: v_791152, onResponseEnd: v_dfd959 }),
  );
  v_be73a0(() => { v_43c42e.current.start(); });
  v_be73a0(() => { v_43c42e.current.stop(); });
  await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(10000); });
  expect(v_dfd959).not.toHaveBeenCalled();
});

it('audioLevel 미가용 → fallback 시간 후 onResponseEnd', async () => {
  const v_dfd959 = jest.fn();
  const v_791152 = jest.fn(() => Promise.resolve(v_15fd85(undefined)));
  const { result: v_43c42e } = v_0da18b(() =>
    v_724dd4({ getStatsReport: v_791152, onResponseEnd: v_dfd959, config: { fallbackWaitMs: 1000 } }),
  );
  v_be73a0(() => { v_43c42e.current.start(); });
  await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(1200); });
  expect(v_dfd959).toHaveBeenCalledTimes(1);
});

it('awaiting→active 전이 시 onResponseStart 1회 호출', async () => {
  const v_ee8eb7 = jest.fn();
  const v_dfd959 = jest.fn();

  const v_66c9c9 = [0, 0.2, 0.2];
  let v_ebec57 = 0;
  const v_791152 = () =>
    Promise.resolve(v_15fd85(v_66c9c9[Math.min(v_ebec57++, v_66c9c9.length - 1)]));

  const { result: v_43c42e } = v_0da18b(() =>
    v_724dd4({ getStatsReport: v_791152, onResponseStart: v_ee8eb7, onResponseEnd: v_dfd959 }),
  );
  v_be73a0(() => { v_43c42e.current.start(); });

  await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(200); });
  await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(200); });
  await v_be73a0(async () => { await jest.advanceTimersByTimeAsync(200); });

  expect(v_ee8eb7).toHaveBeenCalledTimes(1);
});
