import { v_6fea6b, v_3f2d5d, type v_537043 } from "../../src/face/faceTurnJudge";
import type { v_13de12 } from "../../src/face/faceQuality";

const v_fd5f43 = (v_ca1ec5, v_740dd8 = 0.7, quality: v_13de12 = "ok", v_963980 = 0): v_537043 => ({
  personId: v_ca1ec5,
  score: v_740dd8,
  quality: v_c6feb4,
  atMs: v_963980,
});

describe("judgeTurn", () => {
  test("TURN_SAMPLES 는 3", () => expect(v_3f2d5d).toBe(3));

  test("3 unknown → unknown", () =>
    expect(v_6fea6b([v_fd5f43(null, 0.3), v_fd5f43(null, 0.2), v_fd5f43(null, 0.4)], 7).kind).toBe("unknown"));

  test("unknown 은 score 가 3개 중 최대", () =>
    expect(v_6fea6b([v_fd5f43(null, 0.3), v_fd5f43(null, 0.2), v_fd5f43(null, 0.4)], 7)).toMatchObject({
      kind: "unknown",
      personId: null,
      score: 0.4,
    }));

  test("3 same other → switch (score 는 가장 최근 표본)", () =>
    expect(v_6fea6b([v_fd5f43(9), v_fd5f43(9), v_fd5f43(9, 0.62)], 7)).toMatchObject({ kind: "switch", personId: 9, score: 0.62 }));

  test("3 same current → known", () => expect(v_6fea6b([v_fd5f43(7), v_fd5f43(7), v_fd5f43(7)], 7).kind).toBe("known"));

  test("두 사람이 섞이면 가장 최근에 알아본 사람(다른 사람이면 switch)", () =>
    expect(v_6fea6b([v_fd5f43(9), v_fd5f43(7), v_fd5f43(9)], 7)).toMatchObject({ kind: "switch", personId: 9 }));

  test("실통화 17:09:14 — [모름, 오른, 오른] 은 현재 화자 민수가 아니라 오른으로 switch", () =>
    expect(v_6fea6b([v_fd5f43(null, 0.152), v_fd5f43(175, 0.851), v_fd5f43(175, 0.857)], 176)).toMatchObject({
      kind: "switch",
      personId: 175,
      score: 0.857,
    }));

  test("표본 1개라도 이름 있는 얼굴이면 바로(현재 화자면 known)", () => {
    expect(v_6fea6b([v_fd5f43(7)], 7).kind).toBe("known");
    expect(v_6fea6b([v_fd5f43(9)], 7)).toMatchObject({ kind: "switch", personId: 9 });
    expect(v_6fea6b([v_fd5f43(9)], null)).toMatchObject({ kind: "switch", personId: 9 });
  });

  test("unknown mixed with current → keep", () =>
    expect(v_6fea6b([v_fd5f43(null), v_fd5f43(7), v_fd5f43(null)], 7).kind).toBe("known"));

  test("only last 3 count", () =>
    expect(v_6fea6b([v_fd5f43(7), v_fd5f43(null), v_fd5f43(null), v_fd5f43(null)], 7).kind).toBe("unknown"));

  test("불일치 2개뿐이면 unknown 이 아니다 — 현재 화자 유지", () =>
    expect(v_6fea6b([v_fd5f43(null), v_fd5f43(null)], 7)).toMatchObject({ kind: "known", personId: 7, score: null }));

  test("불일치 2개뿐이고 현재 화자도 없으면 insufficient", () =>
    expect(v_6fea6b([v_fd5f43(null), v_fd5f43(null)], null).kind).toBe("insufficient"));

  test("no face samples → insufficient none", () =>
    expect(v_6fea6b([v_fd5f43(null, 0, "none"), v_fd5f43(null, 0, "none"), v_fd5f43(null, 0, "none")], 7)).toMatchObject({
      kind: "insufficient",
      quality: "none",
    }));

  test("현재 화자 없이 섞여도 이름 있는 얼굴이 있으면 그 사람", () =>
    expect(v_6fea6b([v_fd5f43(9), v_fd5f43(null), v_fd5f43(9)], null)).toMatchObject({ kind: "switch", personId: 9 }));

  test("all null 이지만 근거 없는 표본이 섞이면 unknown 이 아니다 — 현재 화자 유지 (quality=마지막)", () =>
    expect(v_6fea6b([v_fd5f43(null, 0.3, "ok"), v_fd5f43(null, 0, "none"), v_fd5f43(null, 0.4, "dark")], 7)).toMatchObject({
      kind: "known",
      personId: 7,
      score: null,
      quality: "dark",
    }));

  test("known 의 score 는 가장 최근 표본의 점수", () =>
    expect(v_6fea6b([v_fd5f43(7, 0.55), v_fd5f43(9, 0.9), v_fd5f43(7, 0.8)], 7)).toMatchObject({
      kind: "known",
      personId: 7,
      score: 0.8,
    }));

  test("이름 있는 다른 사람 + 근거 없는 불일치 → 그 사람으로 switch", () =>
    expect(v_6fea6b([v_fd5f43(9, 0.9), v_fd5f43(null, 0.1), v_fd5f43(9, 0.9)], 7)).toMatchObject({
      kind: "switch",
      personId: 9,
      score: 0.9,
    }));

  test("verdict quality 는 마지막 표본 기준", () =>
    expect(v_6fea6b([v_fd5f43(7, 0.7, "dark"), v_fd5f43(7, 0.7, "ok"), v_fd5f43(7, 0.7, "turned")], 7).quality).toBe("turned"));

  test("입력 배열을 변경하지 않는다 (chronological 순서 유지)", () => {
    const v_bbda62 = [v_fd5f43(9, 0.7, "ok", 300), v_fd5f43(9, 0.7, "ok", 100), v_fd5f43(9, 0.7, "ok", 200)];
    const v_5392c4 = v_bbda62.map((v_62c214) => ({ ...v_62c214 }));
    v_6fea6b(v_bbda62, 7);
    expect(v_bbda62).toEqual(v_5392c4);
  });
});

describe("judgeTurn — 화면 좋은 불일치는 점수와 상관없이 근거(AFL-1097)", () => {
  test("실통화 9246 — 남 얼굴 0.067·0.097·0.128(ok) → unknown", () =>
    expect(v_6fea6b([v_fd5f43(null, 0.067), v_fd5f43(null, 0.097), v_fd5f43(null, 0.128)], 197)).toMatchObject({ kind: "unknown", score: 0.128 }));
  test("실통화 9246 — ok 불일치 2개 + 어두운 화면 1개 → unknown 아님, 현재 화자 유지", () =>
    expect(v_6fea6b([v_fd5f43(null, 0.147), v_fd5f43(null, 0.123), v_fd5f43(null, 0.09, "dark")], 197)).toMatchObject({ kind: "known", personId: 197 }));
  test("점수 0 인 ok 불일치 3개도 unknown", () =>
    expect(v_6fea6b([v_fd5f43(null, 0), v_fd5f43(null, 0), v_fd5f43(null, 0)], null).kind).toBe("unknown"));
  test("어두운 화면 낮은 점수 불일치(비켜선 본인 0.101·0.095) → insufficient", () =>
    expect(v_6fea6b([v_fd5f43(null, 0.101, "dark"), v_fd5f43(null, 0.095, "dark"), v_fd5f43(null, 0.09, "dark")], null).kind).toBe("insufficient"));
  test("옆모습·작은 얼굴 불일치도 근거 아님 → 현재 화자 유지", () =>
    expect(v_6fea6b([v_fd5f43(null, 0.05, "turned"), v_fd5f43(null, 0.05, "small"), v_fd5f43(null, 0.05)], 175)).toMatchObject({ kind: "known", personId: 175 }));
});

describe("judgeTurn — 등록 얼굴이 하나도 없는 클론(2026-10-23)", () => {
  const v_d6db99 = (quality: v_13de12 = "ok"): v_537043 => ({ personId: null, score: 0, quality: v_c6feb4, atMs: 0, noCandidates: true });
  test("비교 대상이 없으면 점수 0 이어도 화면 좋은 얼굴 3개 → unknown(등록 안내)", () =>
    expect(v_6fea6b([v_d6db99(), v_d6db99(), v_d6db99()], null).kind).toBe("unknown"));
  test("비교 대상이 없어도 어두운 화면은 근거가 아니다", () =>
    expect(v_6fea6b([v_d6db99("dark"), v_d6db99("dark"), v_d6db99("dark")], null).kind).toBe("insufficient"));
});
