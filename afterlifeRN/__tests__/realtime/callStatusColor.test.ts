import { glowColorForPhase, GLOW_COLORS } from '../../src/realtime/callStatusColor';

it('listening/confirming → 녹색', () => {
  expect(glowColorForPhase('listening')).toBe(GLOW_COLORS.listening);
  expect(glowColorForPhase('confirming')).toBe(GLOW_COLORS.listening);
});

it('sending → 파랑', () => {
  expect(glowColorForPhase('sending')).toBe(GLOW_COLORS.sending);
});

it('speaking → 빨강', () => {
  expect(glowColorForPhase('speaking')).toBe(GLOW_COLORS.speaking);
});

it('idle/paused → null(글로우 꺼짐)', () => {
  expect(glowColorForPhase('idle')).toBeNull();
  expect(glowColorForPhase('paused')).toBeNull();
});

it('listening, sttActive=false → stalled(흰색)', () => {
  expect(glowColorForPhase('listening', false)).toBe(GLOW_COLORS.stalled);
});

it('confirming, sttActive=false → stalled(흰색)', () => {
  expect(glowColorForPhase('confirming', false)).toBe(GLOW_COLORS.stalled);
});

it('listening, sttActive=true → 녹색(기존 동일)', () => {
  expect(glowColorForPhase('listening', true)).toBe(GLOW_COLORS.listening);
});

it('confirming, sttActive=true → 녹색(기존 동일)', () => {
  expect(glowColorForPhase('confirming', true)).toBe(GLOW_COLORS.listening);
});

it('sending/speaking/idle/paused는 sttActive=false여도 기존 색 유지', () => {
  expect(glowColorForPhase('sending', false)).toBe(GLOW_COLORS.sending);
  expect(glowColorForPhase('speaking', false)).toBe(GLOW_COLORS.speaking);
  expect(glowColorForPhase('idle', false)).toBeNull();
  expect(glowColorForPhase('paused', false)).toBeNull();
});

it('sttActive 생략(기본값) → 기존 동작 무회귀', () => {
  expect(glowColorForPhase('listening')).toBe(GLOW_COLORS.listening);
  expect(glowColorForPhase('confirming')).toBe(GLOW_COLORS.listening);
  expect(glowColorForPhase('sending')).toBe(GLOW_COLORS.sending);
});

it('listening, suppressed=true → speaking(빨강): 클론 발화로 STT 정지 = 녹색 아님', () => {
  expect(glowColorForPhase('listening', true, true)).toBe(GLOW_COLORS.speaking);
});

it('confirming, suppressed=true → speaking(빨강)', () => {
  expect(glowColorForPhase('confirming', true, true)).toBe(GLOW_COLORS.speaking);
});

it('suppressed=true는 sttActive보다 우선 → speaking(빨강)', () => {
  expect(glowColorForPhase('listening', false, true)).toBe(GLOW_COLORS.speaking);
});

it('suppressed 생략/false → 기존 동작 무회귀', () => {
  expect(glowColorForPhase('listening', true, false)).toBe(GLOW_COLORS.listening);
  expect(glowColorForPhase('listening', false, false)).toBe(GLOW_COLORS.stalled);
  expect(glowColorForPhase('listening', true)).toBe(GLOW_COLORS.listening);
});

it('speaking/sending/idle은 suppressed=true여도 phase 색 유지', () => {
  expect(glowColorForPhase('speaking', true, true)).toBe(GLOW_COLORS.speaking);
  expect(glowColorForPhase('sending', true, true)).toBe(GLOW_COLORS.sending);
  expect(glowColorForPhase('idle', true, true)).toBeNull();
});
