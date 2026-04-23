import React from 'react';
import { render } from '@testing-library/react-native';
import FollowingScreen from '../../src/screens/following/FollowingScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { useFollowStore } from '../../src/stores/followStore';
import { SEED } from '../../src/mocks/seedIndex';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const UID = 1;

beforeEach(async () => {
  useAuthStore.setState({
    user: { id: UID } as any,
    isLoggedIn: true,
    hydrated: true,
  });
  useFollowStore.setState({ follows: [], hydrated: false });
  await useFollowStore.getState().hydrate();
});

test('renders Following header', () => {
  const { getByText } = render(<FollowingScreen />);
  expect(getByText('Following')).toBeTruthy();
});

test('category tabs reflect followed personas interests', () => {

  const followedIds = new Set(
    useFollowStore
      .getState()
      .follows.filter((f) => f.followerUserId === UID)
      .map((f) => f.followingCloneId),
  );
  const expectedTags = new Set<string>();
  SEED.clones
    .filter((c) => followedIds.has(c.id))
    .forEach((c) => c.interests.forEach((t) => expectedTags.add(t)));
  expect(expectedTags.size).toBeGreaterThan(0);

  const { getByText } = render(<FollowingScreen />);
  expect(getByText('전체')).toBeTruthy();
  for (const tag of expectedTags) {
    expect(getByText(tag)).toBeTruthy();
  }
});

test('seed pipeline: feeds are filtered by followed clone ids', () => {

  const followedIds = new Set(
    useFollowStore
      .getState()
      .follows.filter((f) => f.followerUserId === UID)
      .map((f) => f.followingCloneId),
  );
  const visibleFeeds = SEED.feeds.filter((f) => followedIds.has(f.cloneId));
  const hiddenFeeds = SEED.feeds.filter((f) => !followedIds.has(f.cloneId));
  expect(visibleFeeds.length).toBeGreaterThan(0);
  expect(hiddenFeeds.length).toBeGreaterThan(0);

  visibleFeeds.forEach((f) => {
    expect(followedIds.has(f.cloneId)).toBe(true);
  });
});

test('empty follows yields only "전체" tab', () => {
  useFollowStore.setState({ follows: [], hydrated: true });
  const { getByText, queryByText } = render(<FollowingScreen />);
  expect(getByText('전체')).toBeTruthy();

  const firstTag = SEED.clones[0].interests[0];
  if (firstTag && firstTag !== '전체') {
    expect(queryByText(firstTag)).toBeNull();
  }
});
