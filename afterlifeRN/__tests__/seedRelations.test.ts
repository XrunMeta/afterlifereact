import followsJson from '../src/mocks/seed/follows.json';
import coownersJson from '../src/mocks/seed/coowners.json';
import feedsJson from '../src/mocks/seed/feeds.json';
import clonesJson from '../src/mocks/seed/clones.json';
import { assertFollows, assertCoowners, assertFeeds } from '../src/mocks/seedLoader';

describe('relation seed', () => {
  it('follows: passes assertion + distribution by cloneType', () => {
    expect(() => assertFollows(followsJson as unknown[])).not.toThrow();

    const bucket: Record<string, number[]> = { memlow: [], friend: [], mentor: [], celeb: [] };
    (clonesJson as any[]).forEach(c => {
      const count = (followsJson as any[]).filter(f => f.followingCloneId === c.id).length;
      bucket[c.cloneType].push(count);
    });
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(bucket.memlow)).toBeLessThanOrEqual(15);
    expect(avg(bucket.friend)).toBeGreaterThanOrEqual(20);
    expect(avg(bucket.friend)).toBeLessThanOrEqual(80);
    expect(avg(bucket.mentor)).toBeGreaterThanOrEqual(50);
    expect(avg(bucket.celeb)).toBeGreaterThanOrEqual(200);
  });

  it('coowners: only memlow clones, 2~4 per clone, status=approved', () => {
    expect(() => assertCoowners(coownersJson as unknown[])).not.toThrow();
    const memlowIds = (clonesJson as any[]).filter(c => c.cloneType === 'memlow').map(c => c.id);
    (coownersJson as any[]).forEach(co => {
      expect(memlowIds).toContain(co.cloneId);
      expect(co.status).toBe('approved');
    });
    memlowIds.forEach(id => {
      const count = (coownersJson as any[]).filter(co => co.cloneId === id).length;
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(4);
    });
  });

  it('feeds: 2~8 per clone, total 50~200', () => {
    expect(() => assertFeeds(feedsJson as unknown[])).not.toThrow();
    (clonesJson as any[]).forEach(c => {
      const count = (feedsJson as any[]).filter(f => f.cloneId === c.id).length;
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(8);
    });
    expect((feedsJson as any[]).length).toBeGreaterThanOrEqual(50);
    expect((feedsJson as any[]).length).toBeLessThanOrEqual(200);
  });
});
