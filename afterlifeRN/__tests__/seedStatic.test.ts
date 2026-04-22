import v_5d0917 from '../src/mocks/seed/users.json';
import v_1d129e from '../src/mocks/seed/clones.json';
import { v_2aa078, v_8e78d0 } from '../src/mocks/seedLoader';

describe('static seed', () => {
  it('users.json has exactly 20 users and passes assertion', () => {
    expect(v_5d0917).toHaveLength(20);
    expect(() => v_2aa078(v_5d0917 as unknown[])).not.toThrow();
  });

  it('clones.json has exactly 24 clones with 6 per cloneType', () => {
    expect(v_1d129e).toHaveLength(24);
    expect(() => v_8e78d0(v_1d129e as unknown[])).not.toThrow();
    const v_773eb2 = {};
    (v_1d129e as any[]).forEach(v_3f4e2e => { v_773eb2[v_3f4e2e.cloneType] = (v_773eb2[v_3f4e2e.cloneType] || 0) + 1; });
    expect(v_773eb2).toEqual({ memlow: 6, friend: 6, mentor: 6, celeb: 6 });
  });

  it('user id 1 is 히즈키 (default logged in)', () => {
    const v_ceb55a = (v_5d0917 as any[])[0];
    expect(v_ceb55a.id).toBe(1);
    expect(v_ceb55a.displayName).toBe('히즈키');
  });

  it('memlow 6th clone is 어린 시절 절친', () => {
    const v_454c98 = (v_1d129e as any[]).filter(v_3f4e2e => v_3f4e2e.cloneType === 'memlow')[5];
    expect(v_454c98.displayName).toContain('어린 시절 절친');
  });
});
