

export function normalizeFrameTimestampMs(rawTimestamp: number, isAndroid: boolean): number {
  'worklet';
  return isAndroid ? rawTimestamp / 1e6 : rawTimestamp;
}
