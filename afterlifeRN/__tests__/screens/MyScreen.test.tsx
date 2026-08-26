import React from 'react';
import { render, screen } from '@testing-library/react-native';
import MyScreen from '../../src/screens/my/MyScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { useFollowStore } from '../../src/stores/followStore';
import { SEED } from '../../src/mocks/seedIndex';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-navigation/native', () => ({

  useNavigation: () => ({ navigate: jest.fn(), dispatch: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => { const c = cb(); return typeof c === 'function' ? c : undefined; }, []);
  },
  useIsFocused: () => true,
  useRoute: () => ({ params: {}, name: 'MockRoute', key: 'mock' }),
  CommonActions: { navigate: jest.fn(), reset: jest.fn() },
}));

beforeEach(async () => {
  await useAuthStore.getState().hydrate();
  useFollowStore.setState({ follows: [], hydrated: false });
  await useFollowStore.getState().hydrate();
});

test('MyScreen renders current user displayName + handle', () => {
  render(<MyScreen />);
  const user001 = SEED.users.find((u) => u.id === 1);
  expect(user001).toBeTruthy();
  expect(screen.getByText(user001!.displayName)).toBeTruthy();
  expect(screen.getByText(user001!.handle)).toBeTruthy();
});

test('MyScreen shows 팔로우 중 and 내 페르소나 counts', () => {
  render(<MyScreen />);
  expect(screen.getByText('팔로우 중')).toBeTruthy();
  expect(screen.getByText('내 클론')).toBeTruthy();
});

test('myClones count equals SEED.clones owned by user id 1', () => {
  render(<MyScreen />);
  const owned = SEED.clones.filter((c) => c.ownerId === 1).length;
  expect(screen.getByText(String(owned))).toBeTruthy();
});
