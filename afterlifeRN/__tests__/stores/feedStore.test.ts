import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeedStore } from '../../src/stores/feedStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useFollowStore } from '../../src/stores/followStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('feedStore.getVisibleFeeds', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAuthStore.setState({
      user: { id: 'user-001' } as any,
      isLoggedIn: true,
      hydrated: true,
    });
    useFollowStore.setState({ follows: [], hydrated: false });
    await useFollowStore.getState().hydrate();
  });

  it('exposes feeds and an initial selectedInterests array', () => {
    expect(Array.isArray(useFeedStore.getState().feeds)).toBe(true);
    expect(useFeedStore.getState().feeds.length).toBeGreaterThan(0);
    expect(Array.isArray(useFeedStore.getState().selectedInterests)).toBe(true);
  });

  it('getVisibleFeeds returns some feeds for user-001 (owner of most clones)', () => {
    const feeds = useFeedStore.getState().getVisibleFeeds();
    expect(feeds.length).toBeGreaterThan(0);
  });

  it('private (memlow) clones do not leak to a non-owner non-coowner user', async () => {
    useAuthStore.setState({
      user: { id: 'user-020' } as any,
      isLoggedIn: true,
      hydrated: true,
    });
    const feeds = useFeedStore.getState().getVisibleFeeds();
    const memlowLeaked = feeds.some((f) => f.cloneId.startsWith('clone-memlow-'));
    expect(memlowLeaked).toBe(false);
  });

  it('getFilteredFeeds returns subset of getVisibleFeeds when interests selected', () => {
    useFeedStore.setState({ selectedInterests: ['일상 대화'] });
    const visible = useFeedStore.getState().getVisibleFeeds();
    const filtered = useFeedStore.getState().getFilteredFeeds();
    expect(filtered.length).toBeLessThanOrEqual(visible.length);
  });

  it('toggleLike/toggleBookmark toggle id sets', () => {
    useFeedStore.getState().toggleLike('feed-xyz');
    expect(useFeedStore.getState().likedIds).toContain('feed-xyz');
    useFeedStore.getState().toggleLike('feed-xyz');
    expect(useFeedStore.getState().likedIds).not.toContain('feed-xyz');

    useFeedStore.getState().toggleBookmark('feed-xyz');
    expect(useFeedStore.getState().bookmarkedIds).toContain('feed-xyz');
  });
});
