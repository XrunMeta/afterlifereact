import { v_2aa078, v_8e78d0, v_5f4862, v_240f60, v_50b973, v_a07f65 } from '../src/mocks/seedLoader';
import type { v_4b85a1, v_924690, v_eceede, v_813230 } from '../src/types/domain';

describe('seedLoader assertions', () => {
  it('assertUsers passes on minimal valid user', () => {
    expect(() => v_2aa078([{ id: 1, displayName: 'x', handle: '@x', createdAt: '2026-01-01T00:00:00Z' }])).not.toThrow();
  });

  it('assertUsers throws when id missing', () => {
    expect(() => v_2aa078([{ displayName: 'x' } as any])).toThrow(/oth-path\[0\]\.id/);
  });

  it('assertClones throws on invalid cloneType', () => {
    expect(() =>
      v_8e78d0([
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
    const v_694b25 = { id: 1, followerUserId: 1, followingCloneId: 1, followedAt: '2026-01-01T00:00:00Z' };
    expect(() => v_5f4862([v_694b25, { ...v_694b25, id: 2 }])).toThrow(/duplicate/);
  });

  it('assertCoowners passes on approved row', () => {
    expect(() =>
      v_240f60([
        { id: 1, cloneId: 1, userId: 1, status: 'approved', invitedAt: '2026-01-01T00:00:00Z', approvedAt: '2026-01-02T00:00:00Z' },
      ]),
    ).not.toThrow();
  });

  it('assertMessages throws on missing cloneId', () => {
    expect(() =>
      v_50b973([{ id: 1, userId: 1, role: 'user', content: 'hi', timestamp: '2026-01-01T00:00:00Z' } as any]),
    ).toThrow(/cloneId/);
  });

  it('assertFeeds passes on minimal feed', () => {
    expect(() =>
      v_a07f65([{ id: 1, cloneId: 1, content: 'hello', createdAt: '2026-01-01T00:00:00Z' }]),
    ).not.toThrow();
  });

  it('assertClones throws when interests contains non-string element', () => {
    expect(() =>
      v_8e78d0([
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
      v_8e78d0([
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
      v_2aa078([{ id: 1, displayName: 'x', handle: '@x', createdAt: '2026-01-01T00:00:00Z' }]),
    ).not.toThrow();
  });
});

describe('domain type shape (compile-time)', () => {
  it('DomainClone exposes optional l1Profile + primaryEditorUserId', () => {
    const c: v_4b85a1 = {
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
      l1Profile: { attrs: { tone: 'warm' }, notes: '' } satisfies v_eceede,
    };
    expect(v_3f4e2e.primaryEditorUserId).toBe(1);
    expect(v_3f4e2e.l1Profile?.attrs.tone).toBe('warm');
  });

  it('DomainShort has required shape + ShortStatus', () => {
    const statuses: v_813230[] = ['queued', 'processing', 'ready', 'failed'];
    const s: v_924690 = {
      id: 1,
      cloneId: 10,
      status: 'ready',
      mediaUrl: 'https://cdn/x.mp4',
      createdAt: '2026-04-23T00:00:00Z',
    };
    expect(v_6460d1).toContain(v_fd5f43.status);
    expect(v_fd5f43.cloneId).toBe(10);
  });
});
