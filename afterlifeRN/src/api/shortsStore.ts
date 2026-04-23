import type { DomainShort } from '../types/domain';
import { SEED } from '../mocks/seedIndex';

let generated: DomainShort[] = [];

function nextId(): number {
  const seedMax = SEED.shorts.reduce((m, s) => (s.id > m ? s.id : m), 0);
  const genMax = generated.reduce((m, s) => (s.id > m ? s.id : m), 0);
  return Math.max(seedMax, genMax) + 1;
}

export function appendGeneratedShort(cloneId: number): DomainShort {
  const row: DomainShort = {
    id: nextId(),
    cloneId,
    status: 'queued',
    mediaUrl: null,
    createdAt: new Date().toISOString(),
  };
  generated = [...generated, row];
  return row;
}

export function allShorts(): DomainShort[] {
  return [...SEED.shorts, ...generated];
}

export function findShort(shortId: number): DomainShort | undefined {
  return allShorts().find((s) => s.id === shortId);
}

export function resetShortsStore(): void {
  generated = [];
}
