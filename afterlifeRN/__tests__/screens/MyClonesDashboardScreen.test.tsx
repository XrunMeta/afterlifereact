import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import MyClonesDashboardScreen from '../../src/screens/clones/MyClonesDashboardScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { useFollowStore } from '../../src/stores/followStore';
import { useCloneStore } from '../../src/stores/cloneStore';
import { SEED } from '../../src/mocks/seedIndex';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), dispatch: jest.fn() }),
  useFocusEffect: jest.fn(),
  CommonActions: { navigate: jest.fn() },
}));

jest.mock('../../src/api/clones', () => ({
  ...jest.requireActual('../../src/api/clones'),
  listMyClones: jest.fn().mockResolvedValue({ items: [] }),
  listSystemClones: jest.fn().mockResolvedValue({
    items: [{ id: 999, username: 'halbae', name: '할배' }],
  }),
}));

beforeEach(async () => {
  await useAuthStore.getState().hydrate();
  useFollowStore.setState({ follows: [], hydrated: false });
  await useFollowStore.getState().hydrate();
  useCloneStore.setState({ localClones: [] });
});

test('shows halbae system clone as callable entry', async () => {

  useAuthStore.setState({ accessToken: 'test-token' });
  render(<MyClonesDashboardScreen />);
  expect(await screen.findByText('할배')).toBeTruthy();
});

test('renders at least one owned clone card', () => {
  render(<MyClonesDashboardScreen />);
  const owned = SEED.clones.filter((c) => c.ownerId === 1);
  expect(owned.length).toBeGreaterThan(0);
  expect(screen.getByText(owned[0].displayName)).toBeTruthy();
});

test('shows follower count badge on owned clones', () => {
  const { getByTestId } = render(<MyClonesDashboardScreen />);
  const firstOwned = SEED.clones.find((c) => c.ownerId === 1)!;
  const node = getByTestId(`follower-count-${firstOwned.id}`);
  expect(node).toBeTruthy();
  expect(node.props.children.join('')).toMatch(/팔로워/);
});

test('shows coowner badge for memlow clones with approved coowners', () => {
  render(<MyClonesDashboardScreen />);
  const memlowWithCoowner = SEED.clones.find(
    (c) =>
      c.ownerId === 1 &&
      c.cloneType === 'memlow' &&
      SEED.coowners.some(
        (co) => co.cloneId === c.id && co.status === 'approved',
      ),
  );
  expect(memlowWithCoowner).toBeTruthy();
  expect(screen.getAllByText(/공동관리자.*명/).length).toBeGreaterThan(0);
});
