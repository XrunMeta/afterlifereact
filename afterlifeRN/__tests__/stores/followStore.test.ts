import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_b4902e } from '../../src/stores/followStore';
import { v_1ed7d9 } from '../../src/stores/authStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

const v_46ee1e = 1;
const v_680bbd = 3;

describe('followStore', () => {
  beforeEach(async () => {
    await v_e84827.clear();
    v_1ed7d9.setState({
      user: { id: 1 } as any,
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
      .follows.find((v_8b5cd8) => v_8b5cd8.followerUserId === 1);
    if (v_f1a0c2) {
      expect(v_b4902e.getState().isFollowing(v_f1a0c2.followingCloneId)).toBe(true);
    }
  });

  it('toggleFollow adds and removes', async () => {
    await v_b4902e.getState().hydrate();

    const v_aa6971 = v_b4902e
      .getState()
      .follows.some(
        (v_8b5cd8) => v_8b5cd8.followerUserId === 1 && v_8b5cd8.followingCloneId === v_46ee1e,
      );
    if (v_aa6971) {
      await v_b4902e.getState().toggleFollow(v_46ee1e);
    }
    await v_b4902e.getState().toggleFollow(v_46ee1e);
    const v_526168 = v_b4902e
      .getState()
      .follows.find(
        (v_8b5cd8) => v_8b5cd8.followerUserId === 1 && v_8b5cd8.followingCloneId === v_46ee1e,
      );
    expect(!!v_526168).toBe(true);
    await v_b4902e.getState().toggleFollow(v_46ee1e);
    const v_530263 = v_b4902e
      .getState()
      .follows.find(
        (v_8b5cd8) => v_8b5cd8.followerUserId === 1 && v_8b5cd8.followingCloneId === v_46ee1e,
      );
    expect(v_530263).toBeUndefined();
  });

  it('toggleFollow persists overrides across hydrate', async () => {
    await v_b4902e.getState().hydrate();
    const v_785f93 = v_b4902e
      .getState()
      .follows.some(
        (v_8b5cd8) => v_8b5cd8.followerUserId === 1 && v_8b5cd8.followingCloneId === v_680bbd,
      );
    if (v_785f93) {
      await v_b4902e.getState().toggleFollow(v_680bbd);
    }
    await v_b4902e.getState().toggleFollow(v_680bbd);
    v_b4902e.setState({ follows: [], hydrated: false });
    await v_b4902e.getState().hydrate();
    const v_3d6122 = v_b4902e
      .getState()
      .follows.find(
        (v_8b5cd8) =>
          v_8b5cd8.followerUserId === 1 &&
          v_8b5cd8.followingCloneId === v_680bbd,
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
