import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthConfigStore } from '../authConfigStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const reset = () =>
  useAuthConfigStore.setState({ googleEnabled: null, loadedFrom: 'unknown' });

beforeEach(async () => {
  await AsyncStorage.clear();
  reset();
  (global.fetch as jest.Mock | undefined)?.mockReset?.();
});

test('초기 상태는 googleEnabled=null (로딩중)', () => {
  expect(useAuthConfigStore.getState().googleEnabled).toBeNull();
  expect(useAuthConfigStore.getState().loadedFrom).toBe('unknown');
});

test('hydrate: 캐시 없으면 null 유지 (refresh 가 결정하도록)', async () => {
  await useAuthConfigStore.getState().hydrate();
  expect(useAuthConfigStore.getState().googleEnabled).toBeNull();
  expect(useAuthConfigStore.getState().loadedFrom).toBe('unknown');
});

test('hydrate: 캐시 있으면 즉시 확정 (깜빡임 없음)', async () => {
  await AsyncStorage.setItem(
    'afterlife.authConfig',
    JSON.stringify({ ios: true, android: false }),
  );
  await useAuthConfigStore.getState().hydrate();
  expect(useAuthConfigStore.getState().googleEnabled).toBe(true); 
  expect(useAuthConfigStore.getState().loadedFrom).toBe('cache');
});

test('hydrate: 캐시가 깨져 있으면 null 유지, 크래시 없음', async () => {
  await AsyncStorage.setItem('afterlife.authConfig', '{ not json');
  await useAuthConfigStore.getState().hydrate();
  expect(useAuthConfigStore.getState().googleEnabled).toBeNull();
});

test('refresh: 원격값 적용 + 캐시 저장 + loadedFrom=remote', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ googleEnabled: { ios: true, android: true }, updatedAt: 1 }),
  }) as unknown as typeof fetch;

  await useAuthConfigStore.getState().refresh();

  expect(useAuthConfigStore.getState().googleEnabled).toBe(true);
  expect(useAuthConfigStore.getState().loadedFrom).toBe('remote');
  const cached = await AsyncStorage.getItem('afterlife.authConfig');
  expect(JSON.parse(cached as string)).toEqual({ ios: true, android: true });
});

test('refresh 실패 + 캐시 없음: false 로 확정 (fail-closed, null 영구화 방지)', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;

  await useAuthConfigStore.getState().refresh();

  expect(useAuthConfigStore.getState().googleEnabled).toBe(false);
  expect(useAuthConfigStore.getState().loadedFrom).toBe('default');
});

test('refresh 실패 + 캐시로 이미 확정됨: 캐시값을 유지한다', async () => {
  useAuthConfigStore.setState({ googleEnabled: true, loadedFrom: 'cache' });
  global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;

  await useAuthConfigStore.getState().refresh();

  expect(useAuthConfigStore.getState().googleEnabled).toBe(true);
  expect(useAuthConfigStore.getState().loadedFrom).toBe('cache');
});

test('refresh: 200 이지만 응답이 파손된 경우 false 로 확정', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ googleEnabled: 'yes' }),
  }) as unknown as typeof fetch;

  await useAuthConfigStore.getState().refresh();

  expect(useAuthConfigStore.getState().googleEnabled).toBe(false);
});

test('refresh: 비200 응답도 false 로 확정', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({}),
  }) as unknown as typeof fetch;

  await useAuthConfigStore.getState().refresh();

  expect(useAuthConfigStore.getState().googleEnabled).toBe(false);
});
