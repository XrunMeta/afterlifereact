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

it('listening, sttActive=false → stalled(흰색)', () => {
  expect(v_972fad('listening', false)).toBe(v_dd26b1.stalled);
});

it('confirming, sttActive=false → stalled(흰색)', () => {
  expect(v_972fad('confirming', false)).toBe(v_dd26b1.stalled);
});

it('listening, sttActive=true → 녹색(기존 동일)', () => {
  expect(v_972fad('listening', true)).toBe(v_dd26b1.listening);
});

it('confirming, sttActive=true → 녹색(기존 동일)', () => {
  expect(v_972fad('confirming', true)).toBe(v_dd26b1.listening);
});

it('sending/speaking/idle/paused는 sttActive=false여도 기존 색 유지', () => {
  expect(v_972fad('sending', false)).toBe(v_dd26b1.sending);
  expect(v_972fad('speaking', false)).toBe(v_dd26b1.speaking);
  expect(v_972fad('idle', false)).toBeNull();
  expect(v_972fad('paused', false)).toBeNull();
});

it('sttActive 생략(기본값) → 기존 동작 무회귀', () => {
  expect(v_972fad('listening')).toBe(v_dd26b1.listening);
  expect(v_972fad('confirming')).toBe(v_dd26b1.listening);
  expect(v_972fad('sending')).toBe(v_dd26b1.sending);
});
