import { describe, it, expect, beforeEach } from "vitest";
import { getFaceIndex, __resetMemoryFaceIndex } from "../src/lib/faceVectors";

describe("faceVectors", () => {
  beforeEach(() => __resetMemoryFaceIndex());
  const env = (over: any = {}) => ({ ENVIRONMENT: "staging", ...over }) as any;
  const vec = (seed: number) => Array.from({ length: 512 }, (_, i) => Math.sin(seed * 1000 + i));

  it("insert 후 같은 namespace에서 query 매칭", async () => {
    const idx = getFaceIndex(env());
    await idx.insert([{ id: "e1", values: vec(1), namespace: "7", metadata: { personId: "3" } }]);
    const r = await idx.query(vec(1), { topK: 3, namespace: "7", returnMetadata: true });
    expect(r.matches[0].id).toBe("e1");
    expect(r.matches[0].score).toBeGreaterThan(0.99);
    expect(r.matches[0].metadata?.personId).toBe("3");
  });
  it("다른 namespace는 격리", async () => {
    const idx = getFaceIndex(env());
    await idx.insert([{ id: "e1", values: vec(1), namespace: "7" }]);
    const r = await idx.query(vec(1), { topK: 3, namespace: "8" });
    expect(r.matches).toHaveLength(0);
  });
  it("deleteByIds 후 미매칭", async () => {
    const idx = getFaceIndex(env());
    await idx.insert([{ id: "e1", values: vec(1), namespace: "7" }]);
    await idx.deleteByIds(["e1"]);
    const r = await idx.query(vec(1), { topK: 3, namespace: "7" });
    expect(r.matches).toHaveLength(0);
  });
  it("production에서 바인딩 없으면 fail-fast", () => {
    expect(() => getFaceIndex(env({ ENVIRONMENT: "production" }))).toThrow();
  });
});
