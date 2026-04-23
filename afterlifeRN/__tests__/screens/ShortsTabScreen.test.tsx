import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ShortsTabScreen from '../../src/screens/shorts/ShortsTabScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { resetShortsStore } from '../../src/api/shortsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

beforeEach(() => {
  resetShortsStore();
  mockNavigate.mockReset();
  useAuthStore.setState({
    user: { id: 1 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
});

test('viewer=1: public + owner short 가 모두 노출 (2건)', async () => {
  const { findByLabelText, queryByLabelText } = render(<ShortsTabScreen />);
  await act(async () => {
    await Promise.resolve();
  });
  expect(await findByLabelText('short-item-0')).toBeTruthy();
  expect(await findByLabelText('short-item-1')).toBeTruthy();
  expect(queryByLabelText('short-item-2')).toBeNull();
});

test('viewer=99999 (stranger): public 만 1건 노출', async () => {
  useAuthStore.setState({
    user: { id: 99999 } as any,
    isLoggedIn: true,
    hydrated: true,
  });
  const { findByLabelText, queryByLabelText } = render(<ShortsTabScreen />);
  await act(async () => {
    await Promise.resolve();
  });
  expect(await findByLabelText('short-item-0')).toBeTruthy();
  expect(queryByLabelText('short-item-1')).toBeNull();
});

test('short-item tap → nav.navigate Chat', async () => {
  const { findByLabelText } = render(<ShortsTabScreen />);
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.press(await findByLabelText('short-item-0'));
  expect(mockNavigate).toHaveBeenCalledWith(
    'Chat',
    expect.objectContaining({ cloneId: expect.any(Number) }),
  );
});

test('short-detail tap → nav.navigate CloneDetail', async () => {
  const { findByLabelText } = render(<ShortsTabScreen />);
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.press(await findByLabelText('short-detail-0'));
  expect(mockNavigate).toHaveBeenCalledWith(
    'CloneDetail',
    expect.objectContaining({ cloneId: expect.any(Number) }),
  );
});

test('items 0건 → empty 텍스트 노출', async () => {
  const client = require('../../src/api/client');
  const spy = jest
    .spyOn(client.apiClient, 'listShorts')
    .mockResolvedValue({ items: [], nextCursor: null });
  const { findByText } = render(<ShortsTabScreen />);
  expect(await findByText(/아직 볼 Shorts/)).toBeTruthy();
  spy.mockRestore();
});
