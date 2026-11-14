import { describe, it, expect, beforeEach } from "vitest";
import { getFaceIndex, __resetMemoryFaceIndex } from "../src/lib/faceVectors";

describe("faceVectors", () => {
  beforeEach(() => __resetMemoryFaceIndex());
  const env = (over: any = {}) => ({ ENVIRONMENT: "staging", ...over }) as any;
  const vec = (seed: number) => Array.from({ length: 128 }, (_, i) => Math.sin(seed * 1000 + i));

  it("insert ??ê°™ì? namespace?ì„œ query ë§¤ì¹­", async () => {
    const idx = getFaceIndex(env());
    await idx.insert([{ id: "e1", values: vec(1), namespace: "7", metadata: { personId: "3" } }]);
    const r = await idx.query(vec(1), { topK: 3, namespace: "7", returnMetadata: true });
    expect(r.matches[0].id).toBe("e1");
    expect(r.matches[0].score).toBeGreaterThan(0.99);
    expect(r.matches[0].metadata?.personId).toBe("3");
  });
  it("?¤ë¥¸ namespace??ê²©ë¦¬", async () => {
    const idx = getFaceIndex(env());
    await idx.insert([{ id: "e1", values: vec(1), namespace: "7" }]);
    const r = await idx.query(vec(1), { topK: 3, namespace: "8" });
    expect(r.matches).toHaveLength(0);
  });
  it("deleteByIds ??ë¯¸ë§¤ì¹?, async () => {
    const idx = getFaceIndex(env());
    await idx.insert([{ id: "e1", values: vec(1), namespace: "7" }]);
    await idx.deleteByIds(["e1"]);
    const r = await idx.query(vec(1), { topK: 3, namespace: "7" });
    expect(r.matches).toHaveLength(0);
  });
  it("production?ì„œ ë°”ì¸???†ìœ¼ë©?fail-fast", () => {
    expect(() => getFaceIndex(env({ ENVIRONMENT: "production" }))).toThrow();
  });
});
