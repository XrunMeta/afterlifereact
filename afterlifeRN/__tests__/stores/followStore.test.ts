import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_b4902e } from '../../src/stores/followStore';
import { v_1ed7d9 } from '../../src/stores/authStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

describe('followStore', () => {
  beforeEach(async () => {
    await v_e84827.clear();
    v_1ed7d9.setState({
      user: { id: 'user-001' } as any,
      isLoggedIn: true,
      hydrated: true,
    });
    v_b4902e.setState({ follows: [], hydrated: false });
  });

  it('hydrate loads seed follows', async () => {
    await v_b4902e.getState().hydrate();
    expect(v_b4902e.getState().follows.length).toBeGreaterThan(0);
    expect(v_b4902e.getState().hydrated).toBe(true);
  });

  it('isFollowing reflects seed', async () => {
    await v_b4902e.getState().hydrate();
    const v_f1a0c2 = v_b4902e
      .getState()
      .follows.find((v_8b5cd8) => v_8b5cd8.followerUserId === 'user-001');
    if (v_f1a0c2) {
      expect(v_b4902e.getState().isFollowing(v_f1a0c2.followingCloneId)).toBe(true);
    }
  });

  it('toggleFollow adds and removes', async () => {
    await v_b4902e.getState().hydrate();
    await v_b4902e.getState().toggleFollow('clone-memlow-01');
    const v_526168 = v_b4902e
      .getState()
      .follows.find(
        (v_8b5cd8) => v_8b5cd8.followerUserId === 'user-001' && v_8b5cd8.followingCloneId === 'clone-memlow-01',
      );
    expect(!!v_526168).toBe(true);
    await v_b4902e.getState().toggleFollow('clone-memlow-01');
    const v_530263 = v_b4902e
      .getState()
      .follows.find(
        (v_8b5cd8) => v_8b5cd8.followerUserId === 'user-001' && v_8b5cd8.followingCloneId === 'clone-memlow-01',
      );
    expect(v_530263).toBeUndefined();
  });

  it('toggleFollow persists overrides across hydrate', async () => {
    await v_b4902e.getState().hydrate();

    await v_b4902e.getState().toggleFollow('clone-memlow-03');
    v_b4902e.setState({ follows: [], hydrated: false });
    await v_b4902e.getState().hydrate();
    const v_3d6122 = v_b4902e
      .getState()
      .follows.find(
        (v_8b5cd8) =>
          v_8b5cd8.followerUserId === 'user-001' &&
          v_8b5cd8.followingCloneId === 'clone-memlow-03',
      );
    expect(!!v_3d6122).toBe(true);
  });

  it('followersCount returns follow count per clone', async () => {
    await v_b4902e.getState().hydrate();
    const v_f1a0c2 = v_b4902e.getState().follows[0];
    const v_7b3f91 = v_b4902e.getState().followersCount(v_f1a0c2.followingCloneId);
    expect(v_7b3f91).toBeGreaterThanOrEqual(1);
  });
});
