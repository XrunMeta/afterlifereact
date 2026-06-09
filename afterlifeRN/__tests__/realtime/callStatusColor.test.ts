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
