import { assertUsers, assertClones, assertFollows, assertCoowners, assertMessages, assertFeeds } from '../src/mocks/seedLoader';

describe('seedLoader assertions', () => {
  it('assertUsers passes on minimal valid user', () => {
    expect(() => assertUsers([{ id: 'u1', displayName: 'x', handle: '@x', createdAt: '2026-01-01T00:00:00Z' }])).not.toThrow();
  });

  it('assertUsers throws when id missing', () => {
    expect(() => assertUsers([{ displayName: 'x' } as any])).toThrow(/oth-path\[0\]\.id/);
  });

  it('assertClones throws on invalid cloneType', () => {
    expect(() =>
      assertClones([
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
    const base = { id: 'f', followerUserId: 'u1', followingCloneId: 'c1', followedAt: '2026-01-01T00:00:00Z' };
    expect(() => assertFollows([base, { ...base, id: 'f2' }])).toThrow(/duplicate/);
  });

  it('assertCoowners passes on approved row', () => {
    expect(() =>
      assertCoowners([
        { id: 'co1', cloneId: 'c1', userId: 'u1', status: 'approved', invitedAt: '2026-01-01T00:00:00Z', approvedAt: '2026-01-02T00:00:00Z' },
      ]),
    ).not.toThrow();
  });

  it('assertMessages throws on missing cloneId', () => {
    expect(() =>
      assertMessages([{ id: 'm1', userId: 'u1', senderType: 'user', text: 'hi', timestamp: '2026-01-01T00:00:00Z' } as any]),
    ).toThrow(/cloneId/);
  });

  it('assertFeeds passes on minimal feed', () => {
    expect(() =>
      assertFeeds([{ id: 'fd1', cloneId: 'c1', text: 'hello', createdAt: '2026-01-01T00:00:00Z' }]),
    ).not.toThrow();
  });

  it('assertClones throws when interests contains non-string element', () => {
    expect(() =>
      assertClones([
        {
          id: 'c1',
          cloneType: 'memlow',
          ownerUserId: 'u1',
          displayName: 'x',
          description: 'x',
          interests: ['ok', 123 as any],
          visibility: 'private',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ]),
    ).toThrow(/interests\[1\]/);
  });

  it('assertClones throws when imageUrl is present but not string', () => {
    expect(() =>
      assertClones([
        {
          id: 'c1',
          cloneType: 'memlow',
          ownerUserId: 'u1',
          displayName: 'x',
          description: 'x',
          interests: [],
          visibility: 'private',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          imageUrl: 42 as any,
        } as any,
      ]),
    ).toThrow(/imageUrl/);
  });

  it('assertUsers passes when optional bio is undefined (not required)', () => {
    expect(() =>
      assertUsers([{ id: 'u1', displayName: 'x', handle: '@x', createdAt: '2026-01-01T00:00:00Z' }]),
    ).not.toThrow();
  });
});
