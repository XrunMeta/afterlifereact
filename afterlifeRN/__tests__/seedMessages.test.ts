import * as fs from 'fs';
import * as path from 'path';
import { assertMessages } from '../src/mocks/seedLoader';
import clonesJson from '../src/mocks/seed/clones.json';

const MSG_DIR = path.join(__dirname, '..', 'src', 'mocks', 'seed', 'messages');

interface CloneMeta { id: number; cloneType: string; }

function fileNameFor(c: CloneMeta, indexWithinType: number): string {
  const padded = String(indexWithinType + 1).padStart(2, '0');
  return `clone-${c.cloneType}-${padded}.json`;
}

describe('per-clone message seed files', () => {
  const clones = clonesJson as unknown as CloneMeta[];
  const indexMap = new Map<number, number>();
  const counters: Record<string, number> = {};
  clones.forEach((c) => {
    const idx = counters[c.cloneType] ?? 0;
    indexMap.set(c.id, idx);
    counters[c.cloneType] = idx + 1;
  });

  it('has a JSON file for every clone', () => {
    clones.forEach((c) => {
      const name = fileNameFor(c, indexMap.get(c.id)!);
      expect(fs.existsSync(path.join(MSG_DIR, name))).toBe(true);
    });
  });

  it('each file has 30~50 messages, schema passes, cloneId matches', () => {
    clones.forEach((c) => {
      const name = fileNameFor(c, indexMap.get(c.id)!);
      const raw = JSON.parse(fs.readFileSync(path.join(MSG_DIR, name), 'utf8'));
      expect(Array.isArray(raw)).toBe(true);
      expect(raw.length).toBeGreaterThanOrEqual(30);
      expect(raw.length).toBeLessThanOrEqual(50);
      expect(() => assertMessages(raw)).not.toThrow();
      raw.forEach((m: any) => expect(m.cloneId).toBe(c.id));
    });
  });
});
