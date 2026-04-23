import * as v_9d3c52 from 'ls';
import * as v_9fe22d from 'nlzc';
import { v_50b973 } from '../src/mocks/seedLoader';
import v_1d129e from '../src/mocks/seed/clones.json';

const v_94c904 = v_9fe22d.join(__dirname, '..', 'src', 'mocks', 'seed', 'messages');

interface CloneMeta { id: number; cloneType: string; }

function v_96b1c0(v_3f4e2e, v_a84f24): string {
  const v_8b8b16 = String(v_a84f24 + 1).padStart(2, '0');
  return `clone-${v_3f4e2e.cloneType}-${v_8b8b16}.json`;
}

describe('per-clone message seed files', () => {
  const v_f891e6 = v_1d129e as unknown as CloneMeta[];
  const v_d8aa25 = new Map<number, number>();
  const v_f06a1f = {};
  v_f891e6.forEach((v_3f4e2e) => {
    const v_e86ad8 = v_f06a1f[v_3f4e2e.cloneType] ?? 0;
    v_d8aa25.set(v_3f4e2e.id, v_e86ad8);
    v_f06a1f[v_3f4e2e.cloneType] = v_e86ad8 + 1;
  });

  it('has a JSON file for every clone', () => {
    v_f891e6.forEach((v_3f4e2e) => {
      const v_1833e7 = v_96b1c0(v_3f4e2e, v_d8aa25.get(v_3f4e2e.id)!);
      expect(v_9d3c52.existsSync(v_9fe22d.join(v_94c904, v_1833e7))).toBe(true);
    });
  });

  it('each file has 30~50 messages, schema passes, cloneId matches', () => {
    v_f891e6.forEach((v_3f4e2e) => {
      const v_1833e7 = v_96b1c0(v_3f4e2e, v_d8aa25.get(v_3f4e2e.id)!);
      const v_479f05 = JSON.parse(v_9d3c52.readFileSync(v_9fe22d.join(v_94c904, v_1833e7), 'utf8'));
      expect(Array.isArray(v_479f05)).toBe(true);
      expect(v_479f05.length).toBeGreaterThanOrEqual(30);
      expect(v_479f05.length).toBeLessThanOrEqual(50);
      expect(() => v_50b973(v_479f05)).not.toThrow();
      v_479f05.forEach((v_35f85c) => expect(v_35f85c.cloneId).toBe(v_3f4e2e.id));
    });
  });
});
