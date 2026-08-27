import { v_dc8a4c, v_99b4fa, v_2ab825 } from '../useAvatarCall';
import { v_5b540b } from '../../stores/callConfigStore';
import { v_b38a7e } from '../useLiveAvatar';
import { v_3d8d48 } from '../usePrethirdAvatar';
import { v_e52b18 } from '../useVisemeAvatar';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('../useLiveAvatar', () => ({
  useLiveAvatar: jest.fn(() => 'second-result'),
}));

jest.mock('../usePrethirdAvatar', () => ({
  usePrethirdAvatar: jest.fn(() => 'prethird-result'),
}));

jest.mock('../useVisemeAvatar', () => ({
  useVisemeAvatar: jest.fn(() => 'viseme-result'),
}));

test('store callRoute=prethird → prethird', () => {
  v_5b540b.setState({ callRoute: 'prethird' });
  expect(v_dc8a4c()).toBe('prethird');
});

test('store callRoute=second → second', () => {
  v_5b540b.setState({ callRoute: 'second' });
  expect(v_dc8a4c()).toBe('second');
});

test('pipeline=viseme_playback → viseme_playback (store 값 무관)', () => {
  v_5b540b.setState({ callRoute: 'prethird' });
  expect(v_dc8a4c('viseme_playback')).toBe('viseme_playback');
  v_5b540b.setState({ callRoute: 'second' });
  expect(v_dc8a4c('viseme_playback')).toBe('viseme_playback');
});

test('pipeline=echomimic_v3 는 route 미변경 (prethird 안에서 experimentalBase 라우팅)', () => {
  v_5b540b.setState({ callRoute: 'prethird' });
  expect(v_dc8a4c('echomimic_v3')).toBe('prethird');
});

describe('lazy session route capture (useAvatarCall)', () => {
  beforeEach(() => {
    v_99b4fa();
    jest.clearAllMocks();
  });

  test('첫 호출 시점 store 값으로 확정 → 이후 store 가 바뀌어도 세션 내내 고정', () => {
    v_5b540b.setState({ callRoute: 'prethird' });

    const v_ea719c = v_2ab825({ cloneId: 1, accessToken: 't' });
    expect(v_ea719c).toBe('prethird-result');
    expect(v_3d8d48).toHaveBeenCalledTimes(1);
    expect(v_b38a7e).not.toHaveBeenCalled();

    v_5b540b.setState({ callRoute: 'second' });
    const v_486a80 = v_2ab825({ cloneId: 1, accessToken: 't' });
    expect(v_486a80).toBe('prethird-result');
    expect(v_3d8d48).toHaveBeenCalledTimes(2);
    expect(v_b38a7e).not.toHaveBeenCalled();
  });

  test('__resetSessionRoute() 후에는 재확정 — 리셋 시점 store 값을 새로 캡처', () => {
    v_5b540b.setState({ callRoute: 'prethird' });
    v_2ab825({ cloneId: 1, accessToken: 't' });
    expect(v_3d8d48).toHaveBeenCalledTimes(1);

    v_99b4fa();
    v_5b540b.setState({ callRoute: 'second' });

    const v_43c42e = v_2ab825({ cloneId: 1, accessToken: 't' });
    expect(v_43c42e).toBe('second-result');
    expect(v_b38a7e).toHaveBeenCalledTimes(1);
  });

  test('opts.pipeline=viseme_playback → useVisemeAvatar 로 디스패치 · store 값 무관', () => {
    v_5b540b.setState({ callRoute: 'prethird' });
    const v_ea719c = v_2ab825({ cloneId: 9126, accessToken: 't', pipeline: 'viseme_playback' });
    expect(v_ea719c).toBe('viseme-result');
    expect(v_e52b18).toHaveBeenCalledTimes(1);
    expect(v_3d8d48).not.toHaveBeenCalled();
    expect(v_b38a7e).not.toHaveBeenCalled();
  });

  test('첫 호출 pipeline 없음 → store 로 확정 · 이후 pipeline=viseme_playback 이어도 route 불변', () => {
    v_5b540b.setState({ callRoute: 'prethird' });
    v_2ab825({ cloneId: 1, accessToken: 't' });
    expect(v_3d8d48).toHaveBeenCalledTimes(1);

    const v_486a80 = v_2ab825({ cloneId: 1, accessToken: 't', pipeline: 'viseme_playback' });
    expect(v_486a80).toBe('prethird-result');
    expect(v_e52b18).not.toHaveBeenCalled();

  });
});
