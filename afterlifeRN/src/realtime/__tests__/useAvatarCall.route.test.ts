import { resolveSessionRoute, __resetSessionRoute, useAvatarCall } from '../useAvatarCall';
import { useCallConfigStore } from '../../stores/callConfigStore';
import { useLiveAvatar } from '../useLiveAvatar';
import { usePrethirdAvatar } from '../usePrethirdAvatar';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../useLiveAvatar', () => ({
  useLiveAvatar: jest.fn(() => 'second-result'),
}));

jest.mock('../usePrethirdAvatar', () => ({
  usePrethirdAvatar: jest.fn(() => 'prethird-result'),
}));

test('store callRoute=prethird → prethird', () => {
  useCallConfigStore.setState({ callRoute: 'prethird' });
  expect(resolveSessionRoute()).toBe('prethird');
});

test('store callRoute=second → second', () => {
  useCallConfigStore.setState({ callRoute: 'second' });
  expect(resolveSessionRoute()).toBe('second');
});

describe('lazy session route capture (useAvatarCall)', () => {
  beforeEach(() => {
    __resetSessionRoute();
    jest.clearAllMocks();
  });

  test('첫 호출 시점 store 값으로 확정 → 이후 store 가 바뀌어도 세션 내내 고정', () => {
    useCallConfigStore.setState({ callRoute: 'prethird' });

    const first = useAvatarCall({ cloneId: 1, accessToken: 't' });
    expect(first).toBe('prethird-result');
    expect(usePrethirdAvatar).toHaveBeenCalledTimes(1);
    expect(useLiveAvatar).not.toHaveBeenCalled();

    useCallConfigStore.setState({ callRoute: 'second' });
    const second = useAvatarCall({ cloneId: 1, accessToken: 't' });
    expect(second).toBe('prethird-result');
    expect(usePrethirdAvatar).toHaveBeenCalledTimes(2);
    expect(useLiveAvatar).not.toHaveBeenCalled();
  });

  test('__resetSessionRoute() 후에는 재확정 — 리셋 시점 store 값을 새로 캡처', () => {
    useCallConfigStore.setState({ callRoute: 'prethird' });
    useAvatarCall({ cloneId: 1, accessToken: 't' });
    expect(usePrethirdAvatar).toHaveBeenCalledTimes(1);

    __resetSessionRoute();
    useCallConfigStore.setState({ callRoute: 'second' });

    const result = useAvatarCall({ cloneId: 1, accessToken: 't' });
    expect(result).toBe('second-result');
    expect(useLiveAvatar).toHaveBeenCalledTimes(1);
  });
});
