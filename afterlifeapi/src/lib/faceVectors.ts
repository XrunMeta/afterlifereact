

export interface FaceIndexRow { id: string; values: number[]; namespace: string; metadata?: Record<string, string> }
export interface FaceIndexLike {
  insert(rows: FaceIndexRow[]): Promise<void>;
  query(values: number[], opts: { topK: number; namespace: string; returnMetadata?: boolean }):
    Promise<{ matches: { id: string; score: number; metadata?: Record<string, string> }[] }>;
  deleteByIds(ids: string[]): Promise<void>;

  getByIds(ids: string[]): Promise<Array<{ id: string; values: number[]; metadata?: Record<string, string>; namespace?: string }>>;
}

export type EmbeddingVersion = 'legacy_512' | 'sface_v1';
export const v_2d7004 = 'legacy_512';
export const v_3b55cf = 512;
export const v_b67318 = 128;

export function v_6bfc3e(v_e2728f, v_dc9db3): EmbeddingVersion {
  if (v_e2728f === 'sface_v1') return 'sface_v1';
  if (v_e2728f === 'legacy_512') return 'legacy_512';

  if (v_dc9db3 === v_b67318) return 'sface_v1';
  return v_2d7004;
}

export function v_5b545a(v_fe889f): EmbeddingVersion | null {
  if (v_fe889f === v_b67318) return 'sface_v1';
  if (v_fe889f === v_3b55cf) return 'legacy_512';
  return null;
}

export function v_a546d9(v_0e1851): string {
  return v_0e1851 === 'sface_v1' ? 'sface_2021dec' : 'w600k_mbf';
}

export function v_fdac1f(v_0e1851): number {
  return v_0e1851 === 'sface_v1' ? v_b67318 : v_3b55cf;
}

const v_e33b0e = {
  legacy_512: new Map(),
  sface_v1: new Map(),
};
export function v_dbed3e() {
  v_e33b0e.legacy_512.clear();
  v_e33b0e.sface_v1.clear();
}

function v_3353a2(v_779914, v_148ff6) {
  let v_801ce6 = 0, v_6faaa0 = 0, v_78071c = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_779914.length; v_ebec57++) {
    const v_8fe318 = v_779914[v_ebec57] ?? 0, v_095f0c = v_148ff6[v_ebec57] ?? 0;
    v_801ce6 += v_8fe318 * v_095f0c; v_6faaa0 += v_8fe318 * v_8fe318; v_78071c += v_095f0c * v_095f0c;
  }
  return v_801ce6 / (Math.sqrt(v_6faaa0) * Math.sqrt(v_78071c) || 1);
}

function v_09acba(v_0e1851): FaceIndexLike {
  const v_d4d4f6 = v_e33b0e[v_0e1851];
  return {
    async insert(v_18b8bf) { for (const v_cb35cb of v_18b8bf) v_d4d4f6.set(v_cb35cb.id, v_cb35cb); },
    async query(v_6fea0b, { topK: v_171a8a, namespace: v_34fa5f, returnMetadata: v_c6243d }) {
      const v_a49907 = [...v_d4d4f6.values()].filter((v_cb35cb) => v_cb35cb.namespace === v_34fa5f)
        .map((v_cb35cb) => ({ id: v_cb35cb.id, score: v_3353a2(v_6fea0b, v_cb35cb.values), metadata: v_c6243d ? v_cb35cb.metadata : undefined }))
        .sort((v_62c214, v_64877a) => v_64877a.score - v_62c214.score).slice(0, v_171a8a);
      return { matches: v_a49907 };
    },
    async deleteByIds(v_52e08b) { for (const v_389afb of v_52e08b) v_d4d4f6.delete(v_389afb); },
    async getByIds(v_52e08b) {
      return v_52e08b.map((v_389afb) => v_d4d4f6.get(v_389afb)).filter((v_cb35cb): v_cb35cb is FaceIndexRow => v_cb35cb != null);
    },
  };
}

function v_102d95(
  v_c9c489,
  v_0e1851,
): VectorizeIndex | undefined {
  return v_0e1851 === 'sface_v1' ? v_c9c489.FACE_VECTORS_V2 : v_c9c489.FACE_VECTORS;
}

export function v_a8d2cc(
  v_c9c489,
  v_0e1851 = v_2d7004,
): FaceIndexLike {
  const v_81e2ef = v_102d95(v_c9c489, v_0e1851);
  if (v_81e2ef) {
    return {
      async insert(v_18b8bf) { await v_81e2ef.insert(v_18b8bf.map((v_cb35cb) => ({ id: v_cb35cb.id, values: v_cb35cb.values, namespace: v_cb35cb.namespace, metadata: v_cb35cb.metadata }))); },
      async query(v_6fea0b, { topK: v_171a8a, namespace: v_34fa5f, returnMetadata: v_c6243d }) {
        const v_cb35cb = await v_81e2ef.query(v_6fea0b, { topK: v_171a8a, namespace: v_34fa5f, returnMetadata: v_c6243d });
        return {
          matches: v_cb35cb.matches.map((v_35f85c) => ({
            id: v_35f85c.id,
            score: v_35f85c.score,
            metadata: v_35f85c.metadata as Record<string, string> | undefined,
          })),
        };
      },
      async deleteByIds(v_52e08b) { await v_81e2ef.deleteByIds(v_52e08b); },
      async getByIds(v_52e08b) {
        if (v_52e08b.length === 0) return [];
        const v_8f00b9 = await v_81e2ef.getByIds(v_52e08b);
        return v_8f00b9.map((v_3ac7e7) => ({
          id: v_3ac7e7.id,
          values: Array.from(v_3ac7e7.values as number[] | Float32Array),
          metadata: v_3ac7e7.metadata as Record<string, string> | undefined,
          namespace: v_3ac7e7.namespace,
        }));
      },
    };
  }

  if (v_c9c489.ENVIRONMENT === "production") {
    const v_1833e7 = v_0e1851 === 'sface_v1' ? 'FACE_VECTORS_V2' : 'FACE_VECTORS';
    throw new Error(`${v_1833e7} binding missing in production`);
  }
  return v_09acba(v_0e1851);
}
