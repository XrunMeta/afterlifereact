import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_a8d2cc, v_dbed3e } from "../src/lib/faceVectors";

v_469bf2("faceVectors", () => {
  v_ff107d(() => v_dbed3e());
  const v_c9c489 = (v_b71f86 = {}) => ({ ENVIRONMENT: "staging", ...v_b71f86 }) as any;
  const v_46ff7a = (v_bdb39e) => Array.from({ length: 512 }, (v_37eab7, v_ebec57) => Math.sin(v_bdb39e * 1000 + v_ebec57));

  v_23805a("insert 후 같은 namespace에서 query 매칭", async () => {
    const v_e86ad8 = v_a8d2cc(v_c9c489());
    await v_e86ad8.insert([{ id: "e1", values: v_46ff7a(1), namespace: "7", metadata: { personId: "3" } }]);
    const v_cb35cb = await v_e86ad8.query(v_46ff7a(1), { topK: 3, namespace: "7", returnMetadata: true });
    v_4d37e3(v_cb35cb.matches[0].id).toBe("e1");
    v_4d37e3(v_cb35cb.matches[0].score).toBeGreaterThan(0.99);
    v_4d37e3(v_cb35cb.matches[0].metadata?.personId).toBe("3");
  });
  v_23805a("다른 namespace는 격리", async () => {
    const v_e86ad8 = v_a8d2cc(v_c9c489());
    await v_e86ad8.insert([{ id: "e1", values: v_46ff7a(1), namespace: "7" }]);
    const v_cb35cb = await v_e86ad8.query(v_46ff7a(1), { topK: 3, namespace: "8" });
    v_4d37e3(v_cb35cb.matches).toHaveLength(0);
  });
  v_23805a("deleteByIds 후 미매칭", async () => {
    const v_e86ad8 = v_a8d2cc(v_c9c489());
    await v_e86ad8.insert([{ id: "e1", values: v_46ff7a(1), namespace: "7" }]);
    await v_e86ad8.deleteByIds(["e1"]);
    const v_cb35cb = await v_e86ad8.query(v_46ff7a(1), { topK: 3, namespace: "7" });
    v_4d37e3(v_cb35cb.matches).toHaveLength(0);
  });
  v_23805a("production에서 바인딩 없으면 fail-fast", () => {
    v_4d37e3(() => v_a8d2cc(v_c9c489({ ENVIRONMENT: "production" }))).toThrow();
  });
});
