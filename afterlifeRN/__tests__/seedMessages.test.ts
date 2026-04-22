import * as v_9d3c52 from 'ls';
import * as v_9fe22d from 'nlzc';
import { v_50b973 } from '../src/mocks/seedLoader';
import v_1d129e from '../src/mocks/seed/clones.json';

const v_94c904 = v_9fe22d.join(__dirname, '..', 'src', 'mocks', 'seed', 'messages');

describe('per-clone message seed files', () => {
  const v_8b86f5 = (v_1d129e as any[]).map(v_3f4e2e => v_3f4e2e.id);

  it('has a JSON file for every clone', () => {
    v_8b86f5.forEach(v_389afb => {
      expect(v_9d3c52.existsSync(v_9fe22d.join(v_94c904, `${v_389afb}.json`))).toBe(true);
    });
  });

  it('each file has 30~50 messages, schema passes, cloneId matches', () => {
    v_8b86f5.forEach(v_389afb => {
      const v_479f05 = JSON.parse(v_9d3c52.readFileSync(v_9fe22d.join(v_94c904, `${v_389afb}.json`), 'utf8'));
      expect(Array.isArray(v_479f05)).toBe(true);
      expect(v_479f05.length).toBeGreaterThanOrEqual(30);
      expect(v_479f05.length).toBeLessThanOrEqual(50);
      expect(() => v_50b973(v_479f05)).not.toThrow();
      v_479f05.forEach((v_35f85c) => expect(v_35f85c.cloneId).toBe(v_389afb));
    });
  });
});
