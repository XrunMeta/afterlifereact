import { normalizeFrameTimestampMs } from "../../src/face/frameTimestamp";

it("iOS(isAndroid=false) → 이미 ms이므로 그대로 반환", () => {
  expect(normalizeFrameTimestampMs(1234.5, false)).toBe(1234.5);
});

it("Android(isAndroid=true) → ns 입력을 ms로 변환(1e6 나눔)", () => {

  expect(normalizeFrameTimestampMs(1_000_000, true)).toBe(1);
  expect(normalizeFrameTimestampMs(1_500_000_000, true)).toBe(1500);
});

it("Android ns 입력이 두 프레임 간 1000ms 미만 차이면 스로틀이 여전히 false 유지(회귀 방지)", () => {

  const prevNs = 1_000_000_000; 
  const nowNs = 1_000_500_000; 
  const prevMs = normalizeFrameTimestampMs(prevNs, true);
  const nowMs = normalizeFrameTimestampMs(nowNs, true);
  expect(nowMs - prevMs).toBeLessThan(1000); 
});

it("Android ns 입력이 1000ms 이상 차이면 스로틀 통과 조건 충족", () => {
  const prevNs = 1_000_000_000; 
  const nowNs = 2_100_000_000; 
  const prevMs = normalizeFrameTimestampMs(prevNs, true);
  const nowMs = normalizeFrameTimestampMs(nowNs, true);
  expect(nowMs - prevMs).toBeGreaterThanOrEqual(1000);
});
