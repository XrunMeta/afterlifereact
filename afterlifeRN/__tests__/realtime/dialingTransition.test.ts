import { dialingOutcome, DEFAULT_DIALING_CONFIG } from '../../src/realtime/dialingTransition';

const cfg = DEFAULT_DIALING_CONFIG; 

it('live지만 최소노출 전 → dialing', () => {
  expect(dialingOutcome('live', 1000, cfg)).toBe('dialing');
});

it('live + 최소노출 경과 → connected', () => {
  expect(dialingOutcome('live', 3000, cfg)).toBe('connected');
});

it('connecting + 타임아웃 경과 → timeout', () => {
  expect(dialingOutcome('connecting', 20000, cfg)).toBe('timeout');
});

it('connecting + 타임아웃 전 → dialing', () => {
  expect(dialingOutcome('connecting', 5000, cfg)).toBe('dialing');
});

it('error → error (즉시)', () => {
  expect(dialingOutcome('error', 0, cfg)).toBe('error');
});

it('ended → error (즉시, el R1)', () => {
  expect(dialingOutcome('ended', 0, cfg)).toBe('error');
});

it('requesting + 타임아웃 전 → dialing', () => {
  expect(dialingOutcome('requesting', 1000, cfg)).toBe('dialing');
});

it('connecting + timeoutMs 직전(19999) → dialing', () => {
  expect(dialingOutcome('connecting', 19999, cfg)).toBe('dialing');
});
