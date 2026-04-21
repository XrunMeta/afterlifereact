import * as fs from 'fs';
import * as path from 'path';
import { assertMessages } from '../src/mocks/seedLoader';
import clonesJson from '../src/mocks/seed/clones.json';

const MSG_DIR = path.join(__dirname, '..', 'src', 'mocks', 'seed', 'messages');

describe('per-clone message seed files', () => {
  const cloneIds = (clonesJson as any[]).map(c => c.id);

  it.skip('has a JSON file for every clone', () => {
    cloneIds.forEach(id => {
      expect(fs.existsSync(path.join(MSG_DIR, `${id}.json`))).toBe(true);
    });
  });

  it.skip('each file has 30~50 messages, schema passes, cloneId matches', () => {
    cloneIds.forEach(id => {
      const raw = JSON.parse(fs.readFileSync(path.join(MSG_DIR, `${id}.json`), 'utf8'));
      expect(Array.isArray(raw)).toBe(true);
      expect(raw.length).toBeGreaterThanOrEqual(30);
      expect(raw.length).toBeLessThanOrEqual(50);
      expect(() => assertMessages(raw)).not.toThrow();
      raw.forEach((m: any) => expect(m.cloneId).toBe(id));
    });
  });
});
