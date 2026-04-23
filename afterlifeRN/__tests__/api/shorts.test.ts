import { v_9a8286 } from '../../src/api/client';
import { v_5fbf8f } from '../../src/api/shortsStore';
import { v_35d5ed } from '../../src/mocks/seedIndex';

describe('apiClient.listShorts', () => {
  beforeEach(() => v_5fbf8f());

  it('returns ready shorts sorted by shortId desc', async () => {
    const v_8f00b9 = await v_9a8286.listShorts(v_35d5ed.clones[0].ownerId);
    expect(Array.isArray(v_8f00b9.items)).toBe(true);
    const v_52e08b = v_8f00b9.items.map((v_fd5f43) => v_fd5f43.shortId);
    const v_b16994 = [...v_52e08b].sort((v_779914, v_148ff6) => v_148ff6 - v_779914);
    expect(v_52e08b).toEqual(v_b16994);
  });

  it('includes public clones regardless of viewer', async () => {
    const v_4c98a4 = v_35d5ed.clones.find((v_3f4e2e) => v_3f4e2e.visibility === 'public');
    if (!v_4c98a4) throw new Error('seed needs at least one public clone');
    const v_0b00e8 = 9999;
    const v_8f00b9 = await v_9a8286.listShorts(v_0b00e8);
    expect(v_8f00b9.items.some((v_fd5f43) => v_fd5f43.cloneId === v_4c98a4.id)).toBe(true);
  });

  it('excludes private clones for non-owner non-coowner', async () => {
    const v_0b00e8 = 99999;
    const v_99b80d = v_35d5ed.clones.find(
      (v_3f4e2e) =>
        v_3f4e2e.visibility === 'private' &&
        v_3f4e2e.ownerId !== v_0b00e8 &&
        !v_35d5ed.coowners.some(
          (v_c4a45b) => v_c4a45b.cloneId === v_3f4e2e.id && v_c4a45b.userId === v_0b00e8 && v_c4a45b.status === 'approved',
        ),
    );
    if (!v_99b80d) throw new Error('seed needs private clone without stranger access');
    const v_8f00b9 = await v_9a8286.listShorts(v_0b00e8);
    expect(v_8f00b9.items.some((v_fd5f43) => v_fd5f43.cloneId === v_99b80d.id)).toBe(false);
  });

  it('includes private clones for owner', async () => {
    const v_99b80d = v_35d5ed.clones.find((v_3f4e2e) => v_3f4e2e.visibility === 'private');
    if (!v_99b80d) throw new Error('seed needs private clone');
    const v_8f00b9 = await v_9a8286.listShorts(v_99b80d.ownerId);
    expect(v_8f00b9.items.some((v_fd5f43) => v_fd5f43.cloneId === v_99b80d.id)).toBe(true);
  });
});

describe('apiClient.generateShort', () => {
  beforeEach(() => v_5fbf8f());

  it('rejects when viewer is not owner', async () => {
    const v_eb25ce = v_35d5ed.clones[0];
    const v_1c6644 = v_eb25ce.ownerId + 10_000;
    await expect(v_9a8286.generateShort(v_eb25ce.id, v_1c6644)).rejects.toThrow(/forbidden|owner/i);
  });

  it('returns queued shortId, then getShort returns same id', async () => {
    const v_eb25ce = v_35d5ed.clones[0];
    const { shortId: v_53aa09, status: v_d308b5 } = await v_9a8286.generateShort(v_eb25ce.id, v_eb25ce.ownerId);
    expect(v_d308b5).toBe('queued');
    const v_df0713 = await v_9a8286.getShort(v_53aa09);
    expect(v_df0713.shortId).toBe(v_53aa09);
    expect(['queued', 'processing', 'ready']).toContain(v_df0713.status);
  });

  it('assigns monotonically increasing ids across generate calls', async () => {
    const v_eb25ce = v_35d5ed.clones[0];
    const v_779914 = await v_9a8286.generateShort(v_eb25ce.id, v_eb25ce.ownerId);
    const v_148ff6 = await v_9a8286.generateShort(v_eb25ce.id, v_eb25ce.ownerId);
    expect(v_148ff6.shortId).toBeGreaterThan(v_779914.shortId);
  });
});
