import { renderHook, act } from '@testing-library/react-native';
import { useCloneSilenceDetector } from '../../src/realtime/useCloneSilenceDetector';

function reportWith(level: number | undefined) {
  const stats: Array<[string, Record<string, unknown>]> = [
    ['v', { type: 'inbound-rtp', kind: 'video' }],
  ];
  if (level !== undefined) stats.push(['a', { type: 'inbound-rtp', kind: 'audio', audioLevel: level }]);
  return stats;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

it('소리 → 무음 1.2s 지속 → onResponseEnd 1회', async () => {
  let level = 0.5;
  const onResponseEnd = jest.fn();
  const getStatsReport = jest.fn(() => Promise.resolve(reportWith(level)));
  const { result } = renderHook(() =>
    useCloneSilenceDetector({ getStatsReport, onResponseEnd }),
  );
  act(() => { result.current.start(); });
  await act(async () => { await jest.advanceTimersByTimeAsync(200); });
  level = 0.0;
  await act(async () => { await jest.advanceTimersByTimeAsync(1400); });
  expect(onResponseEnd).toHaveBeenCalledTimes(1);
});

it('stop() 후에는 콜백 안 옴', async () => {
  const onResponseEnd = jest.fn();
  const getStatsReport = jest.fn(() => Promise.resolve(reportWith(0.0)));
  const { result } = renderHook(() =>
    useCloneSilenceDetector({ getStatsReport, onResponseEnd }),
  );
  act(() => { result.current.start(); });
  act(() => { result.current.stop(); });
  await act(async () => { await jest.advanceTimersByTimeAsync(10000); });
  expect(onResponseEnd).not.toHaveBeenCalled();
});

it('audioLevel 미가용 → fallback 시간 후 onResponseEnd', async () => {
  const onResponseEnd = jest.fn();
  const getStatsReport = jest.fn(() => Promise.resolve(reportWith(undefined)));
  const { result } = renderHook(() =>
    useCloneSilenceDetector({ getStatsReport, onResponseEnd, config: { fallbackWaitMs: 1000 } }),
  );
  act(() => { result.current.start(); });
  await act(async () => { await jest.advanceTimersByTimeAsync(1200); });
  expect(onResponseEnd).toHaveBeenCalledTimes(1);
});

it('awaiting→active 직후 무음 지속 → onResponseStart 1회 + onResponseEnd 호출', async () => {
  const onResponseStart = jest.fn();
  const onResponseEnd = jest.fn();

  const levels = [0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0];
  let i = 0;
  const getStatsReport = () =>
    Promise.resolve(reportWith(levels[Math.min(i++, levels.length - 1)]));

  const { result } = renderHook(() =>
    useCloneSilenceDetector({ getStatsReport, onResponseStart, onResponseEnd }),
  );
  act(() => { result.current.start(); });

  await act(async () => { await jest.advanceTimersByTimeAsync(200); });
  await act(async () => { await jest.advanceTimersByTimeAsync(200); });
  expect(onResponseStart).toHaveBeenCalledTimes(1);

  await act(async () => { await jest.advanceTimersByTimeAsync(1400); });
  expect(onResponseStart).toHaveBeenCalledTimes(1); 
  expect(onResponseEnd).toHaveBeenCalledTimes(1);
});

it('awaiting→active 전이 시 onResponseStart 1회 호출', async () => {
  const onResponseStart = jest.fn();
  const onResponseEnd = jest.fn();

  const levels = [0, 0.2, 0.2];
  let i = 0;
  const getStatsReport = () =>
    Promise.resolve(reportWith(levels[Math.min(i++, levels.length - 1)]));

  const { result } = renderHook(() =>
    useCloneSilenceDetector({ getStatsReport, onResponseStart, onResponseEnd }),
  );
  act(() => { result.current.start(); });

  await act(async () => { await jest.advanceTimersByTimeAsync(200); });
  await act(async () => { await jest.advanceTimersByTimeAsync(200); });
  await act(async () => { await jest.advanceTimersByTimeAsync(200); });

  expect(onResponseStart).toHaveBeenCalledTimes(1);
});
