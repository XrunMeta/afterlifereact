import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ensureGoogleConfigured, __resetGoogleConfiguredForTest } from '../googleAuth';

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn() },
}));

const configureMock = GoogleSignin.configure as unknown as jest.Mock;

beforeEach(() => {
  configureMock.mockReset();
  __resetGoogleConfiguredForTest();
});

test('성공하면 true 를 반환하고 configure 를 1회 호출', () => {
  configureMock.mockImplementation(() => undefined);
  expect(ensureGoogleConfigured()).toBe(true);
  expect(configureMock).toHaveBeenCalledTimes(1);
});

test('두 번 호출해도 configure 는 1회만 실행된다', () => {
  configureMock.mockImplementation(() => undefined);
  ensureGoogleConfigured();
  ensureGoogleConfigured();
  expect(configureMock).toHaveBeenCalledTimes(1);
});

test('configure 가 throw 해도 던지지 않고 false 를 반환', () => {
  configureMock.mockImplementation(() => {
    throw new Error('no client id');
  });
  expect(() => ensureGoogleConfigured()).not.toThrow();
  expect(ensureGoogleConfigured()).toBe(false);
});

test('실패 후 재호출해도 재시도하지 않는다', () => {
  configureMock.mockImplementation(() => {
    throw new Error('no client id');
  });
  ensureGoogleConfigured();
  ensureGoogleConfigured();
  expect(configureMock).toHaveBeenCalledTimes(1);
});

test('configure 가 rejected promise 를 반환해도 unhandled rejection 이 나지 않는다', async () => {
  configureMock.mockImplementation(() => Promise.reject(new Error('async fail')));
  expect(ensureGoogleConfigured()).toBe(true); 

  await new Promise((r) => setTimeout(r, 0));
});
