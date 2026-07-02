import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallConfigStore } from '../callConfigStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const reset = () =>
  useCallConfigStore.setState({
    prethirdBase: 'https://rtc.example.invalid/prethird',
    callRoute: 'prethird',
    secondBase: null,
    loadedFrom: 'default',
  });

beforeEach(async () => {
  await AsyncStorage.clear();
  reset();
  (global.fetch as jest.Mock | undefined)?.mockReset?.();
});

test('refresh: 원격값 적용 + 캐시 저장 + loadedFrom=remote', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ prethirdBase: 'https://rtc.example.invalid/prethird', callRoute: 'prethird', secondBase: null }),
  }) as unknown as typeof fetch;
  await useCallConfigStore.getState().refresh();
  const s = useCallConfigStore.getState();
  expect(s.prethirdBase).toBe('https://rtc.example.invalid/prethird');
  expect(s.loadedFrom).toBe('remote');
  expect(await AsyncStorage.getItem('afterlife.callConfig')).toContain('rtc.example.invalid');
});

test('refresh 실패(fetch throw): 기존 값 유지, 크래시 없음', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
  await useCallConfigStore.getState().refresh();
  const s = useCallConfigStore.getState();
  expect(s.prethirdBase).toContain('rtc.example.invalid');

  expect(s.loadedFrom).toBe('default');
});

test('hydrate: 캐시된 값(기본값과 다른 값) 로드 + loadedFrom=cache', async () => {
  await AsyncStorage.setItem(
    'afterlife.callConfig',
    JSON.stringify({
      prethirdBase: 'https://other.example/prethird',
      callRoute: 'second',
      secondBase: 'https://sec.example',
    }),
  );
  await useCallConfigStore.getState().hydrate();
  const s = useCallConfigStore.getState();

  expect(s.prethirdBase).toBe('https://other.example/prethird');
  expect(s.callRoute).toBe('second');
  expect(s.secondBase).toBe('https://sec.example');
  expect(s.loadedFrom).toBe('cache');
});

test('refresh: 잘못된 callRoute → prethird 방어', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ prethirdBase: 'https://x/prethird', callRoute: 'bogus', secondBase: null }),
  }) as unknown as typeof fetch;
  await useCallConfigStore.getState().refresh();
  expect(useCallConfigStore.getState().callRoute).toBe('prethird');
});
