import { apiClient } from '../../src/api/client';
import { resetShortsStore } from '../../src/api/shortsStore';
import { SEED } from '../../src/mocks/seedIndex';

describe('apiClient.listShorts', () => {
  beforeEach(() => resetShortsStore());

  it('returns ready shorts sorted by shortId desc', async () => {
    const res = await apiClient.listShorts(SEED.clones[0].ownerId);
    expect(Array.isArray(res.items)).toBe(true);
    const ids = res.items.map((s) => s.shortId);
    const sorted = [...ids].sort((a, b) => b - a);
    expect(ids).toEqual(sorted);
  });

  it('includes public clones regardless of viewer', async () => {
    const publicClone = SEED.clones.find((c) => c.visibility === 'public');
    if (!publicClone) throw new Error('seed needs at least one public clone');
    const strangerId = 9999;
    const res = await apiClient.listShorts(strangerId);
    expect(res.items.some((s) => s.cloneId === publicClone.id)).toBe(true);
  });

  it('excludes private clones for non-owner non-coowner', async () => {
    const strangerId = 99999;
    const privateClone = SEED.clones.find(
      (c) =>
        c.visibility === 'private' &&
        c.ownerId !== strangerId &&
        !SEED.coowners.some(
          (co) => co.cloneId === c.id && co.userId === strangerId && co.status === 'approved',
        ),
    );
    if (!privateClone) throw new Error('seed needs private clone without stranger access');
    const res = await apiClient.listShorts(strangerId);
    expect(res.items.some((s) => s.cloneId === privateClone.id)).toBe(false);
  });

  it('includes private clones for owner', async () => {
    const privateClone = SEED.clones.find((c) => c.visibility === 'private');
    if (!privateClone) throw new Error('seed needs private clone');
    const res = await apiClient.listShorts(privateClone.ownerId);
    expect(res.items.some((s) => s.cloneId === privateClone.id)).toBe(true);
  });
});

describe('apiClient.generateShort', () => {
  beforeEach(() => resetShortsStore());

  it('rejects when viewer is not owner', async () => {
    const clone = SEED.clones[0];
    const stranger = clone.ownerId + 10_000;
    await expect(apiClient.generateShort(clone.id, stranger)).rejects.toThrow(/forbidden|owner/i);
  });

  it('returns queued shortId, then getShort returns same id', async () => {
    const clone = SEED.clones[0];
    const { shortId, status } = await apiClient.generateShort(clone.id, clone.ownerId);
    expect(status).toBe('queued');
    const got = await apiClient.getShort(shortId);
    expect(got.shortId).toBe(shortId);
    expect(['queued', 'processing', 'ready']).toContain(got.status);
  });

  it('assigns monotonically increasing ids across generate calls', async () => {
    const clone = SEED.clones[0];
    const a = await apiClient.generateShort(clone.id, clone.ownerId);
    const b = await apiClient.generateShort(clone.id, clone.ownerId);
    expect(b.shortId).toBeGreaterThan(a.shortId);
  });
});
