import v_15cf28 from '../src/mocks/seed/follows.json';
import v_89e393 from '../src/mocks/seed/coowners.json';
import v_fbd07d from '../src/mocks/seed/feeds.json';
import v_1d129e from '../src/mocks/seed/clones.json';
import { v_5f4862, v_240f60, v_a07f65 } from '../src/mocks/seedLoader';

describe('relation seed', () => {
  it('follows: passes assertion + distribution by cloneType', () => {
    expect(() => v_5f4862(v_15cf28 as unknown[])).not.toThrow();

    const v_dc53ea = { memlow: [], friend: [], mentor: [], celeb: [] };
    (v_1d129e as any[]).forEach(v_3f4e2e => {
      const v_9e8c70 = (v_15cf28 as any[]).filter(v_8b5cd8 => v_8b5cd8.followingCloneId === v_3f4e2e.id).length;
      v_dc53ea[v_3f4e2e.cloneType].push(v_9e8c70);
    });
    const v_b94caa = (v_6bdf03) => v_6bdf03.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6, 0) / v_6bdf03.length;
    expect(v_b94caa(v_dc53ea.memlow)).toBeLessThanOrEqual(15);
    expect(v_b94caa(v_dc53ea.friend)).toBeGreaterThanOrEqual(20);
    expect(v_b94caa(v_dc53ea.friend)).toBeLessThanOrEqual(80);
    expect(v_b94caa(v_dc53ea.mentor)).toBeGreaterThanOrEqual(50);
    expect(v_b94caa(v_dc53ea.celeb)).toBeGreaterThanOrEqual(200);
  });

  it('coowners: only memlow clones, 2~4 per clone, status=approved', () => {
    expect(() => v_240f60(v_89e393 as unknown[])).not.toThrow();
    const v_de908f = (v_1d129e as any[]).filter(v_3f4e2e => v_3f4e2e.cloneType === 'memlow').map(v_3f4e2e => v_3f4e2e.id);
    (v_89e393 as any[]).forEach(v_c4a45b => {
      expect(v_de908f).toContain(v_c4a45b.cloneId);
      expect(v_c4a45b.status).toBe('approved');
    });
    v_de908f.forEach(v_389afb => {
      const v_9e8c70 = (v_89e393 as any[]).filter(v_c4a45b => v_c4a45b.cloneId === v_389afb).length;
      expect(v_9e8c70).toBeGreaterThanOrEqual(2);
      expect(v_9e8c70).toBeLessThanOrEqual(4);
    });
  });

  it('feeds: 2~8 per clone, total 50~200', () => {
    expect(() => v_a07f65(v_fbd07d as unknown[])).not.toThrow();
    (v_1d129e as any[]).forEach(v_3f4e2e => {
      const v_9e8c70 = (v_fbd07d as any[]).filter(v_8b5cd8 => v_8b5cd8.cloneId === v_3f4e2e.id).length;
      expect(v_9e8c70).toBeGreaterThanOrEqual(2);
      expect(v_9e8c70).toBeLessThanOrEqual(8);
    });
    expect((v_fbd07d as any[]).length).toBeGreaterThanOrEqual(50);
    expect((v_fbd07d as any[]).length).toBeLessThanOrEqual(200);
  });
});
