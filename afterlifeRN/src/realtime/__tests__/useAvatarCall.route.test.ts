import { v_dc8a4c, v_99b4fa, v_2ab825 } from '../useAvatarCall';
import { v_5b540b } from '../../stores/callConfigStore';
import { v_b38a7e } from '../useLiveAvatar';
import { v_3d8d48 } from '../usePrethirdAvatar';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('../useLiveAvatar', () => ({
  useLiveAvatar: jest.fn(() => 'second-result'),
}));

jest.mock('../usePrethirdAvatar', () => ({
  usePrethirdAvatar: jest.fn(() => 'prethird-result'),
}));

test('store callRoute=prethird → prethird', () => {
  v_5b540b.setState({ callRoute: 'prethird' });
  expect(v_dc8a4c()).toBe('prethird');
});

test('store callRoute=second → second', () => {
  v_5b540b.setState({ callRoute: 'second' });
  expect(v_dc8a4c()).toBe('second');
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
});
