import { assertUsers, assertClones, assertFollows, assertCoowners, assertMessages, assertFeeds } from '../src/mocks/seedLoader';
import type { DomainClone, DomainShort, L1Profile, ShortStatus } from '../src/types/domain';

describe('seedLoader assertions', () => {
  it('assertUsers passes on minimal valid user', () => {
    expect(() => assertUsers([{ id: 1, displayName: 'x', handle: '@x', createdAt: '2026-01-01T00:00:00Z' }])).not.toThrow();
  });

  it('assertUsers throws when id missing', () => {
    expect(() => assertUsers([{ displayName: 'x' } as any])).toThrow(/oth-path\[0\]\.id/);
  });

  it('assertClones throws on invalid cloneType', () => {
    expect(() =>
      assertClones([
        {
          id: 1,
          cloneType: 'BAD',
          ownerId: 1,
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
    const base = { id: 1, followerUserId: 1, followingCloneId: 1, followedAt: '2026-01-01T00:00:00Z' };
    expect(() => assertFollows([base, { ...base, id: 2 }])).toThrow(/duplicate/);
  });

  it('assertCoowners passes on approved row', () => {
    expect(() =>
      assertCoowners([
        { id: 1, cloneId: 1, userId: 1, status: 'approved', invitedAt: '2026-01-01T00:00:00Z', approvedAt: '2026-01-02T00:00:00Z' },
      ]),
    ).not.toThrow();
  });

  it('assertMessages throws on missing cloneId', () => {
    expect(() =>
      assertMessages([{ id: 1, userId: 1, role: 'user', content: 'hi', timestamp: '2026-01-01T00:00:00Z' } as any]),
    ).toThrow(/cloneId/);
  });

  it('assertFeeds passes on minimal feed', () => {
    expect(() =>
      assertFeeds([{ id: 1, cloneId: 1, content: 'hello', createdAt: '2026-01-01T00:00:00Z' }]),
    ).not.toThrow();
  });

  it('assertClones throws when interests contains non-string element', () => {
    expect(() =>
      assertClones([
        {
          id: 1,
          cloneType: 'memlow',
          ownerId: 1,
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
          id: 1,
          cloneType: 'memlow',
          ownerId: 1,
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
      assertUsers([{ id: 1, displayName: 'x', handle: '@x', createdAt: '2026-01-01T00:00:00Z' }]),
    ).not.toThrow();
  });
});

describe('domain type shape (compile-time)', () => {
  it('DomainClone exposes optional l1Profile + primaryEditorUserId', () => {
    const c: DomainClone = {
      id: 1,
      cloneType: 'memlow',
      ownerId: 1,
      displayName: 'x',
      description: 'x',
      interests: [],
      visibility: 'private',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      primaryEditorUserId: 1,
      l1Profile: { attrs: { tone: 'warm' }, notes: '' } satisfies L1Profile,
    };
    expect(c.primaryEditorUserId).toBe(1);
    expect(c.l1Profile?.attrs.tone).toBe('warm');
  });

  it('DomainShort has required shape + ShortStatus', () => {
    const statuses: ShortStatus[] = ['queued', 'processing', 'ready', 'failed'];
    const s: DomainShort = {
      id: 1,
      cloneId: 10,
      status: 'ready',
      mediaUrl: 'https://cdn/x.mp4',
      createdAt: '2026-04-23T00:00:00Z',
    };
    expect(statuses).toContain(s.status);
    expect(s.cloneId).toBe(10);
  });
});
