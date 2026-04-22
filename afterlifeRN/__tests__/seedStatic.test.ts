import usersJson from '../src/mocks/seed/users.json';
import clonesJson from '../src/mocks/seed/clones.json';
import { assertUsers, assertClones } from '../src/mocks/seedLoader';

describe('static seed', () => {
  it('users.json has exactly 20 users and passes assertion', () => {
    expect(usersJson).toHaveLength(20);
    expect(() => assertUsers(usersJson as unknown[])).not.toThrow();
  });

  it('clones.json has exactly 24 clones with 6 per cloneType', () => {
    expect(clonesJson).toHaveLength(24);
    expect(() => assertClones(clonesJson as unknown[])).not.toThrow();
    const byType: Record<string, number> = {};
    (clonesJson as any[]).forEach(c => { byType[c.cloneType] = (byType[c.cloneType] || 0) + 1; });
    expect(byType).toEqual({ memlow: 6, friend: 6, mentor: 6, celeb: 6 });
  });

  it('user id 1 is 히즈키 (default logged in)', () => {
    const u = (usersJson as any[])[0];
    expect(u.id).toBe(1);
    expect(u.displayName).toBe('히즈키');
  });

  it('memlow 6th clone is 어린 시절 절친', () => {
    const memlow6 = (clonesJson as any[]).filter(c => c.cloneType === 'memlow')[5];
    expect(memlow6.displayName).toContain('어린 시절 절친');
  });
});
