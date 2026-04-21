import { v_2aa078, v_8e78d0, v_5f4862, v_240f60, v_50b973, v_a07f65 } from '../src/mocks/seedLoader';

describe('seedLoader assertions', () => {
  it('assertUsers passes on minimal valid user', () => {
    expect(() => v_2aa078([{ id: 'u1', displayName: 'x', handle: '@x', createdAt: '2026-01-01T00:00:00Z' }])).not.toThrow();
  });

  it('assertUsers throws when id missing', () => {
    expect(() => v_2aa078([{ displayName: 'x' } as any])).toThrow(/oth-path\[0\]\.id/);
  });

  it('assertClones throws on invalid cloneType', () => {
    expect(() =>
      v_8e78d0([
        {
          id: 'c1',
          cloneType: 'BAD',
          ownerUserId: 'u1',
          displayName: 'x',
          description: 'x',
          interests: [],
          visibility: 'public',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ]),
    ).toThrow(/cloneType/);
  });

  it('assertFollows throws on duplicate (followerUserId, followingCloneId)', () => {
    const v_694b25 = { id: 'f', followerUserId: 'u1', followingCloneId: 'c1', followedAt: '2026-01-01T00:00:00Z' };
    expect(() => v_5f4862([v_694b25, { ...v_694b25, id: 'f2' }])).toThrow(/duplicate/);
  });

  it('assertCoowners passes on approved row', () => {
    expect(() =>
      v_240f60([
        { id: 'co1', cloneId: 'c1', userId: 'u1', status: 'approved', invitedAt: '2026-01-01T00:00:00Z', approvedAt: '2026-01-02T00:00:00Z' },
      ]),
    ).not.toThrow();
  });

  it('assertMessages throws on missing cloneId', () => {
    expect(() =>
      v_50b973([{ id: 'm1', userId: 'u1', senderType: 'user', text: 'hi', timestamp: '2026-01-01T00:00:00Z' } as any]),
    ).toThrow(/cloneId/);
  });

  it('assertFeeds passes on minimal feed', () => {
    expect(() =>
      v_a07f65([{ id: 'fd1', cloneId: 'c1', text: 'hello', createdAt: '2026-01-01T00:00:00Z' }]),
    ).not.toThrow();
  });
});
