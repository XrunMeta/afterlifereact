import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFollowStore } from '../../src/stores/followStore';
import { useAuthStore } from '../../src/stores/authStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('followStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAuthStore.setState({
      user: { id: 'user-001' } as any,
      isLoggedIn: true,
      hydrated: true,
    });
    useFollowStore.setState({ follows: [], hydrated: false });
  });

  it('hydrate loads seed follows', async () => {
    await useFollowStore.getState().hydrate();
    expect(useFollowStore.getState().follows.length).toBeGreaterThan(0);
    expect(useFollowStore.getState().hydrated).toBe(true);
  });

  it('isFollowing reflects seed', async () => {
    await useFollowStore.getState().hydrate();
    const sample = useFollowStore
      .getState()
      .follows.find((f) => f.followerUserId === 'user-001');
    if (sample) {
      expect(useFollowStore.getState().isFollowing(sample.followingCloneId)).toBe(true);
    }
  });

  it('toggleFollow adds and removes', async () => {
    await useFollowStore.getState().hydrate();
    await useFollowStore.getState().toggleFollow('clone-memlow-01');
    const existed = useFollowStore
      .getState()
      .follows.find(
        (f) => f.followerUserId === 'user-001' && f.followingCloneId === 'clone-memlow-01',
      );
    expect(!!existed).toBe(true);
    await useFollowStore.getState().toggleFollow('clone-memlow-01');
    const gone = useFollowStore
      .getState()
      .follows.find(
        (f) => f.followerUserId === 'user-001' && f.followingCloneId === 'clone-memlow-01',
      );
    expect(gone).toBeUndefined();
  });

  it('toggleFollow persists overrides across hydrate', async () => {
    await useFollowStore.getState().hydrate();

    await useFollowStore.getState().toggleFollow('clone-memlow-03');
    useFollowStore.setState({ follows: [], hydrated: false });
    await useFollowStore.getState().hydrate();
    const rehydrated = useFollowStore
      .getState()
      .follows.find(
        (f) =>
          f.followerUserId === 'user-001' &&
          f.followingCloneId === 'clone-memlow-03',
      );
    expect(!!rehydrated).toBe(true);
  });

  it('followersCount returns follow count per clone', async () => {
    await useFollowStore.getState().hydrate();
    const sample = useFollowStore.getState().follows[0];
    const cnt = useFollowStore.getState().followersCount(sample.followingCloneId);
    expect(cnt).toBeGreaterThanOrEqual(1);
  });
});
