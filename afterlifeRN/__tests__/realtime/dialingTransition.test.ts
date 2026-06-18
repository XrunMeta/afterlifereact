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

it('connecting + timeoutMs 직전(19999) → dialing', () => {
  expect(v_f135e1('connecting', 19999, v_01dcf5)).toBe('dialing');
});

describe('dialingOutcome — greeting 게이팅', () => {
  it('greetingStarted=false면 live여도 dialing 유지', () => {
    expect(v_f135e1('live', 5000, v_01dcf5, false)).toBe('dialing');
  });

  it('greetingStarted=true + minMs 경과면 connected', () => {
    expect(v_f135e1('live', 5000, v_01dcf5, true)).toBe('connected');
  });

  it('greetingStarted=true 라도 minMs 전이면 dialing(깜빡임 방지)', () => {
    expect(v_f135e1('live', 1000, v_01dcf5, true)).toBe('dialing');
  });

  it('greetingStarted 인자 생략(undefined) 시 기존 동작(live=connected) 무회귀', () => {
    expect(v_f135e1('live', 5000, v_01dcf5)).toBe('connected');
  });

  it('error/timeout 은 greetingStarted 무관하게 동일', () => {
    expect(v_f135e1('error', 0, v_01dcf5, false)).toBe('error');
    expect(v_f135e1('connecting', 25000, v_01dcf5, false)).toBe('timeout');
  });
});
