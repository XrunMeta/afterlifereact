

export interface FaceIndexRow { id: string; values: number[]; namespace: string; metadata?: Record<string, string> }
export interface FaceIndexLike {
  insert(rows: FaceIndexRow[]): Promise<void>;
  query(values: number[], opts: { topK: number; namespace: string; returnMetadata?: boolean }):
    Promise<{ matches: { id: string; score: number; metadata?: Record<string, string> }[] }>;
  deleteByIds(ids: string[]): Promise<void>;

  getByIds(ids: string[]): Promise<Array<{ id: string; values: number[]; metadata?: Record<string, string>; namespace?: string }>>;
}

const mem = new Map<string, FaceIndexRow>();
export function __resetMemoryFaceIndex() { mem.clear(); }

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0, bv = b[i] ?? 0;
    dot += av * bv; na += av * av; nb += bv * bv;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

const memoryIndex: FaceIndexLike = {
  async insert(rows) { for (const r of rows) mem.set(r.id, r); },
  async query(values, { topK, namespace, returnMetadata }) {
    const matches = [...mem.values()].filter((r) => r.namespace === namespace)
      .map((r) => ({ id: r.id, score: cosine(values, r.values), metadata: returnMetadata ? r.metadata : undefined }))
      .sort((x, y) => y.score - x.score).slice(0, topK);
    return { matches };
  },
  async deleteByIds(ids) { for (const id of ids) mem.delete(id); },
  async getByIds(ids) {
    return ids.map((id) => mem.get(id)).filter((r): r is FaceIndexRow => r != null);
  },
};

export function getFaceIndex(env: { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string }): FaceIndexLike {
  if (env.FACE_VECTORS) {
    const v = env.FACE_VECTORS;
    return {
      async insert(rows) { await v.insert(rows.map((r) => ({ id: r.id, values: r.values, namespace: r.namespace, metadata: r.metadata }))); },
      async query(values, { topK, namespace, returnMetadata }) {
        const r = await v.query(values, { topK, namespace, returnMetadata });
        return {
          matches: r.matches.map((m: VectorizeMatch) => ({
            id: m.id,
            score: m.score,
            metadata: m.metadata as Record<string, string> | undefined,
          })),
        };
      },
      async deleteByIds(ids) { await v.deleteByIds(ids); },
      async getByIds(ids) {
        if (ids.length === 0) return [];
        const res = await v.getByIds(ids);
        return res.map((row: VectorizeVector) => ({
          id: row.id,
          values: Array.from(row.values as number[] | Float32Array),
          metadata: row.metadata as Record<string, string> | undefined,
          namespace: row.namespace,
        }));
      },
    };
  }
  if (env.ENVIRONMENT === "production") throw new Error("FACE_VECTORS binding missing in production"); 
  return memoryIndex;
}
