import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_5b540b } from '../callConfigStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

const v_487a25 = () =>
  v_5b540b.setState({
    prethirdBase: 'https://rtc.example.invalid/prethird',
    callRoute: 'prethird',
    secondBase: null,
    loadedFrom: 'default',
  });

beforeEach(async () => {
  await v_e84827.clear();
  v_487a25();
  (global.fetch as jest.Mock | undefined)?.mockReset?.();
});

test('refresh: 원격값 적용 + 캐시 저장 + loadedFrom=remote', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ prethirdBase: 'https://rtc.example.invalid/prethird', callRoute: 'prethird', secondBase: null }),
  }) as unknown as typeof fetch;
  await v_5b540b.getState().refresh();
  const v_fd5f43 = v_5b540b.getState();
  expect(v_fd5f43.prethirdBase).toBe('https://rtc.example.invalid/prethird');
  expect(v_fd5f43.loadedFrom).toBe('remote');
  expect(await v_e84827.getItem('afterlife.callConfig')).toContain('rtc.example.invalid');
});

test('refresh 실패(fetch throw): 기존 값 유지, 크래시 없음', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
  await v_5b540b.getState().refresh();
  const v_fd5f43 = v_5b540b.getState();
  expect(v_fd5f43.prethirdBase).toContain('rtc.example.invalid');

  expect(v_fd5f43.loadedFrom).toBe('default');
});

test('hydrate: 캐시된 값(기본값과 다른 값) 로드 + loadedFrom=cache', async () => {
  await v_e84827.setItem(
    'afterlife.callConfig',
    JSON.stringify({
      prethirdBase: 'https://other.example/prethird',
      callRoute: 'second',
      secondBase: 'https://sec.example',
    }),
  );
  await v_5b540b.getState().hydrate();
  const v_fd5f43 = v_5b540b.getState();

  expect(v_fd5f43.prethirdBase).toBe('https://other.example/prethird');
  expect(v_fd5f43.callRoute).toBe('second');
  expect(v_fd5f43.secondBase).toBe('https://sec.example');
  expect(v_fd5f43.loadedFrom).toBe('cache');
});

test('refresh: 잘못된 callRoute → prethird 방어', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ prethirdBase: 'https://x/prethird', callRoute: 'bogus', secondBase: null }),
  }) as unknown as typeof fetch;
  await v_5b540b.getState().refresh();
  expect(v_5b540b.getState().callRoute).toBe('prethird');
});
