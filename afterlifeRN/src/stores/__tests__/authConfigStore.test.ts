import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_688424 } from '../authConfigStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

const v_487a25 = () =>
  v_688424.setState({ googleEnabled: null, loadedFrom: 'unknown' });

beforeEach(async () => {
  await v_e84827.clear();
  v_487a25();
  (global.fetch as jest.Mock | undefined)?.mockReset?.();
});

test('초기 상태는 googleEnabled=null (로딩중)', () => {
  expect(v_688424.getState().googleEnabled).toBeNull();
  expect(v_688424.getState().loadedFrom).toBe('unknown');
});

test('hydrate: 캐시 없으면 null 유지 (refresh 가 결정하도록)', async () => {
  await v_688424.getState().hydrate();
  expect(v_688424.getState().googleEnabled).toBeNull();
  expect(v_688424.getState().loadedFrom).toBe('unknown');
});

test('hydrate: 캐시 있으면 즉시 확정 (깜빡임 없음)', async () => {
  await v_e84827.setItem(
    'afterlife.authConfig',
    JSON.stringify({ ios: true, android: false }),
  );
  await v_688424.getState().hydrate();
  expect(v_688424.getState().googleEnabled).toBe(true); 
  expect(v_688424.getState().loadedFrom).toBe('cache');
});

test('hydrate: 캐시가 깨져 있으면 null 유지, 크래시 없음', async () => {
  await v_e84827.setItem('afterlife.authConfig', '{ not json');
  await v_688424.getState().hydrate();
  expect(v_688424.getState().googleEnabled).toBeNull();
});

test('refresh: 원격값 적용 + 캐시 저장 + loadedFrom=remote', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ googleEnabled: { ios: true, android: true }, updatedAt: 1 }),
  }) as unknown as typeof fetch;

  await v_688424.getState().refresh();

  expect(v_688424.getState().googleEnabled).toBe(true);
  expect(v_688424.getState().loadedFrom).toBe('remote');
  const v_e2a6a6 = await v_e84827.getItem('afterlife.authConfig');
  expect(JSON.parse(v_e2a6a6 as string)).toEqual({ ios: true, android: true });
});

test('refresh 실패 + 캐시 없음: false 로 확정 (fail-closed, null 영구화 방지)', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;

  await v_688424.getState().refresh();

  expect(v_688424.getState().googleEnabled).toBe(false);
  expect(v_688424.getState().loadedFrom).toBe('default');
});

test('refresh 실패 + 캐시로 이미 확정됨: 캐시값을 유지한다', async () => {
  v_688424.setState({ googleEnabled: true, loadedFrom: 'cache' });
  global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;

  await v_688424.getState().refresh();

  expect(v_688424.getState().googleEnabled).toBe(true);
  expect(v_688424.getState().loadedFrom).toBe('cache');
});

test('refresh: 200 이지만 응답이 파손된 경우 false 로 확정', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ googleEnabled: 'yes' }),
  }) as unknown as typeof fetch;

  await v_688424.getState().refresh();

  expect(v_688424.getState().googleEnabled).toBe(false);
});

test('refresh: 비200 응답도 false 로 확정', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({}),
  }) as unknown as typeof fetch;

  await v_688424.getState().refresh();

  expect(v_688424.getState().googleEnabled).toBe(false);
});
