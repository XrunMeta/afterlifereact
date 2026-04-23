import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import Step8CreateShortsScreen from '../../src/screens/clone-creation/Step8CreateShortsScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { resetShortsStore } from '../../src/api/shortsStore';
import { apiClient } from '../../src/api/client';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const dispatch = jest.fn();
function makeNav() {
  return {
    navigate: jest.fn(),
    replace: jest.fn(),
    getParent: () => ({ dispatch }),
  } as any;
}

beforeEach(() => {
  jest.useFakeTimers();
  useAuthStore.setState({
    user: { id: 1 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
  resetShortsStore();
  dispatch.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

test('owner: queued → ready 전이 후 preview 렌더', async () => {

  const getShortSpy = jest
    .spyOn(apiClient, 'getShort')
    .mockResolvedValue({ shortId: 4, status: 'ready', mediaUrl: 'https://cdn/x.mp4' });

  const navigation = makeNav();
  const { findByLabelText } = render(
    <Step8CreateShortsScreen
      route={{ params: { cloneId: 1 } } as any}
      navigation={navigation}
    />,
  );

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  await act(async () => {
    await Promise.resolve();
  });

  expect(await findByLabelText('step8-preview')).toBeTruthy();
  getShortSpy.mockRestore();
});

test('step8-skip: HomeTab 으로 탭 이동', async () => {
  const navigation = makeNav();
  const { findByLabelText } = render(
    <Step8CreateShortsScreen
      route={{ params: { cloneId: 1 } } as any}
      navigation={navigation}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.press(await findByLabelText('step8-skip'));
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'NAVIGATE',
      payload: expect.objectContaining({ name: 'HomeTab' }),
    }),
  );
});

test('non-owner: generateShort 거부 → 권한 없음 메시지', async () => {
  useAuthStore.setState({
    user: { id: 99999 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
  const navigation = makeNav();
  const { findByLabelText } = render(
    <Step8CreateShortsScreen
      route={{ params: { cloneId: 1 } } as any}
      navigation={navigation}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(await findByLabelText('step8-forbidden')).toBeTruthy();
});
