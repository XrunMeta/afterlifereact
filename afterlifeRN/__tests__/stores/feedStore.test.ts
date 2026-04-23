import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_37977a } from '../../src/stores/feedStore';
import { v_1ed7d9 } from '../../src/stores/authStore';
import { v_b4902e } from '../../src/stores/followStore';
import { v_35d5ed } from '../../src/mocks/seedIndex';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

describe('feedStore.getVisibleFeeds', () => {
  beforeEach(async () => {
    await v_e84827.clear();
    v_1ed7d9.setState({
      user: { id: 1 } as any,
      isLoggedIn: true,
      hydrated: true,
    });
    v_b4902e.setState({ follows: [], hydrated: false });
    await v_b4902e.getState().hydrate();
  });

  it('exposes feeds and an initial selectedInterests array', () => {
    expect(Array.isArray(v_37977a.getState().feeds)).toBe(true);
    expect(v_37977a.getState().feeds.length).toBeGreaterThan(0);
    expect(Array.isArray(v_37977a.getState().selectedInterests)).toBe(true);
  });

  it('getVisibleFeeds returns some feeds for user id 1 (owner of most clones)', () => {
    const v_632473 = v_37977a.getState().getVisibleFeeds();
    expect(v_632473.length).toBeGreaterThan(0);
  });

  it('private (memlow) clones do not leak to a non-owner non-coowner user', async () => {
    v_1ed7d9.setState({
      user: { id: 20 } as any,
      isLoggedIn: true,
      hydrated: true,
    });
    const v_f36555 = new Set(
      v_35d5ed.clones.filter((v_3f4e2e) => v_3f4e2e.cloneType === 'memlow').map((v_3f4e2e) => v_3f4e2e.id),
    );
    const v_632473 = v_37977a.getState().getVisibleFeeds();
    const v_3881cf = v_632473.some((v_8b5cd8) => v_f36555.has(v_8b5cd8.cloneId));
    expect(v_3881cf).toBe(false);
  });

  it('getFilteredFeeds returns subset of getVisibleFeeds when interests selected', () => {
    v_37977a.setState({ selectedInterests: ['일상 대화'] });
    const v_cf55be = v_37977a.getState().getVisibleFeeds();
    const v_e4cf17 = v_37977a.getState().getFilteredFeeds();
    expect(v_e4cf17.length).toBeLessThanOrEqual(v_cf55be.length);
  });

  it('toggleLike/toggleBookmark toggle id sets', () => {
    v_37977a.getState().toggleLike(999);
    expect(v_37977a.getState().likedIds).toContain(999);
    v_37977a.getState().toggleLike(999);
    expect(v_37977a.getState().likedIds).not.toContain(999);

    v_37977a.getState().toggleBookmark(999);
    expect(v_37977a.getState().bookmarkedIds).toContain(999);
  });
});
