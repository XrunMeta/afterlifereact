import { v_972fad, v_dd26b1 } from '../../src/realtime/callStatusColor';

it('listening/confirming → 녹색', () => {
  expect(v_972fad('listening')).toBe(v_dd26b1.listening);
  expect(v_972fad('confirming')).toBe(v_dd26b1.listening);
});

it('sending → 파랑', () => {
  expect(v_972fad('sending')).toBe(v_dd26b1.sending);
});

it('speaking → 빨강', () => {
  expect(v_972fad('speaking')).toBe(v_dd26b1.speaking);
});

it('idle/paused → null(글로우 꺼짐)', () => {
  expect(v_972fad('idle')).toBeNull();
  expect(v_972fad('paused')).toBeNull();
});
