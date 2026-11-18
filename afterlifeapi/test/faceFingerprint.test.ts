

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_9c55e0, v_c74d52, v_3d4e91, v_c25ba9 } from "../src/lib/faceFingerprint";
import { v_60c684 } from "../src/lib/faceEmbed";
import { v_8a9589 } from "../src/lib/ale";
import { v_07f4f9, v_666e61 } from "../src/lib/faceVectorSeal";
import { v_a8614b } from "../src/lib/ale";

const v_07f7ef = new Uint8Array(32);
for (let v_ebec57 = 0; v_ebec57 < 32; v_ebec57++) v_07f7ef[v_ebec57] = v_ebec57;
const v_864dbf = v_8a9589(v_07f7ef);

function v_8aeeef(v_bdb39e): number[] {

  const v_8d4337 = new Array<number>(v_60c684);
  let v_fd5f43 = v_bdb39e;
  for (let v_ebec57 = 0; v_ebec57 < v_60c684; v_ebec57++) {
    v_fd5f43 = (v_fd5f43 * 1103515245 + 12345) & 0x7fffffff;
    v_8d4337[v_ebec57] = (v_fd5f43 / 0x7fffffff) - 0.5; 
  }
  return v_8d4337;
}

v_469bf2("T12 faceFingerprint", () => {
  v_23805a("deriveProjection 은 KEK 당 결정적이다", () => {
    const v_5b6e4b = v_9c55e0(v_864dbf);
    const v_d6c160 = v_9c55e0(v_864dbf);
    v_4d37e3(v_5b6e4b).toBe(v_d6c160); 
    v_4d37e3(v_5b6e4b.length).toBe(v_60c684 * v_c25ba9);
  });

  v_23805a("같은 입력 벡터는 같은 fingerprint 를 낸다", () => {
    const v_81e2ef = v_8aeeef(42);
    const v_ae1a4d = v_9c55e0(v_864dbf);
    const v_d73eec = v_c74d52(v_81e2ef, v_ae1a4d);
    const v_5ad92f = v_c74d52(v_81e2ef, v_ae1a4d);
    v_4d37e3(v_d73eec).toEqual(v_5ad92f);
    v_4d37e3(v_d73eec.length).toBe(v_c25ba9);
    v_4d37e3(v_d73eec.every((v_62c214) => v_62c214 === 1 || v_62c214 === -1)).toBe(true);
  });

  v_23805a("같은 얼굴 변동(노이즈 +ε) 은 fingerprint cosine 이 높다", () => {
    const v_694b25 = v_8aeeef(7);
    const v_0992d6 = v_694b25.map((v_62c214) => v_62c214 + (Math.random() - 0.5) * 0.001);
    const v_ae1a4d = v_9c55e0(v_864dbf);
    const v_740dd8 = v_3d4e91(
      v_c74d52(v_694b25, v_ae1a4d),
      v_c74d52(v_0992d6, v_ae1a4d),
    );

    v_4d37e3(v_740dd8).toBeGreaterThan(0.7);
  });

  v_23805a("다른 얼굴은 fingerprint cosine 이 낮다 (평균적으로 0 근방)", () => {
    const v_ae1a4d = v_9c55e0(v_864dbf);
    const v_392321 = [];
    for (let v_ebec57 = 0; v_ebec57 < 20; v_ebec57++) {
      const v_779914 = v_c74d52(v_8aeeef(1000 + v_ebec57), v_ae1a4d);
      const v_148ff6 = v_c74d52(v_8aeeef(2000 + v_ebec57), v_ae1a4d);
      v_392321.push(v_3d4e91(v_779914, v_148ff6));
    }
    const v_ee4872 = v_392321.reduce((v_fd5f43, v_62c214) => v_fd5f43 + v_62c214, 0) / v_392321.length;
    v_4d37e3(Math.abs(v_ee4872)).toBeLessThan(0.3);
  });
});

v_469bf2("T12 faceVectorSeal", () => {
  v_23805a("seal → open 은 원본과 일치한다 (float32 반올림 허용)", () => {
    const v_e38ca2 = v_a8614b(v_864dbf);
    const v_81e2ef = v_8aeeef(99);
    const v_3263c7 = v_07f4f9(v_81e2ef, v_e38ca2);
    v_4d37e3(v_3263c7.startsWith("v2.")).toBe(true);
    const v_8d4337 = v_666e61(v_3263c7, v_e38ca2);
    v_4d37e3(v_8d4337.length).toBe(v_60c684);
    for (let v_ebec57 = 0; v_ebec57 < v_60c684; v_ebec57++) {
      v_4d37e3(Math.abs((v_8d4337[v_ebec57] ?? 0) - (v_81e2ef[v_ebec57] ?? 0))).toBeLessThan(1e-6);
    }
  });

  v_23805a("차원 오류는 예외", () => {
    const v_e38ca2 = v_a8614b(v_864dbf);
    v_4d37e3(() => v_07f4f9([1, 2, 3], v_e38ca2)).toThrow(/expected/);
  });
});
