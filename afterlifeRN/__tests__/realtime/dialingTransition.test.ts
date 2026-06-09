import { v_f135e1, v_cfc2ee } from '../../src/realtime/dialingTransition';

const v_01dcf5 = v_cfc2ee; 

it('live지만 최소노출 전 → dialing', () => {
  expect(v_f135e1('live', 1000, v_01dcf5)).toBe('dialing');
});

it('live + 최소노출 경과 → connected', () => {
  expect(v_f135e1('live', 3000, v_01dcf5)).toBe('connected');
});

it('connecting + 타임아웃 경과 → timeout', () => {
  expect(v_f135e1('connecting', 20000, v_01dcf5)).toBe('timeout');
});

it('connecting + 타임아웃 전 → dialing', () => {
  expect(v_f135e1('connecting', 5000, v_01dcf5)).toBe('dialing');
});

it('error → error (즉시)', () => {
  expect(v_f135e1('error', 0, v_01dcf5)).toBe('error');
});

it('ended → error (즉시, el R1)', () => {
  expect(v_f135e1('ended', 0, v_01dcf5)).toBe('error');
});

it('requesting + 타임아웃 전 → dialing', () => {
  expect(v_f135e1('requesting', 1000, v_01dcf5)).toBe('dialing');
});
