import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFollowStore } from '../../src/stores/followStore';
import { useAuthStore } from '../../src/stores/authStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const MEMLOW_CLONE_ID_A = 1;
const MEMLOW_CLONE_ID_B = 3;

describe('followStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAuthStore.setState({
      user: { id: 1 } as any,
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
      .follows.find((f) => f.followerUserId === 1);
    if (sample) {
      expect(useFollowStore.getState().isFollowing(sample.followingCloneId)).toBe(true);
    }
  });

  it('toggleFollow adds and removes', async () => {
    await useFollowStore.getState().hydrate();

    const initiallyFollowing = useFollowStore
      .getState()
      .follows.some(
        (f) => f.followerUserId === 1 && f.followingCloneId === MEMLOW_CLONE_ID_A,
      );
    if (initiallyFollowing) {
      await useFollowStore.getState().toggleFollow(MEMLOW_CLONE_ID_A);
    }
    await useFollowStore.getState().toggleFollow(MEMLOW_CLONE_ID_A);
    const existed = useFollowStore
      .getState()
      .follows.find(
        (f) => f.followerUserId === 1 && f.followingCloneId === MEMLOW_CLONE_ID_A,
      );
    expect(!!existed).toBe(true);
    await useFollowStore.getState().toggleFollow(MEMLOW_CLONE_ID_A);
    const gone = useFollowStore
      .getState()
      .follows.find(
        (f) => f.followerUserId === 1 && f.followingCloneId === MEMLOW_CLONE_ID_A,
      );
    expect(gone).toBeUndefined();
  });

  it('toggleFollow persists overrides across hydrate', async () => {
    await useFollowStore.getState().hydrate();
    const alreadyFollowing = useFollowStore
      .getState()
      .follows.some(
        (f) => f.followerUserId === 1 && f.followingCloneId === MEMLOW_CLONE_ID_B,
      );
    if (alreadyFollowing) {
      await useFollowStore.getState().toggleFollow(MEMLOW_CLONE_ID_B);
    }
    await useFollowStore.getState().toggleFollow(MEMLOW_CLONE_ID_B);
    useFollowStore.setState({ follows: [], hydrated: false });
    await useFollowStore.getState().hydrate();
    const rehydrated = useFollowStore
      .getState()
      .follows.find(
        (f) =>
          f.followerUserId === 1 &&
          f.followingCloneId === MEMLOW_CLONE_ID_B,
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
