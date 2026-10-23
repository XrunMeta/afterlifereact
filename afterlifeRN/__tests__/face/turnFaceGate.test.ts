import {
  v_a3f569,
  v_e7eefa,
  v_febfc7,
  v_692765,
  v_2faee6,
} from "../../src/face/turnFaceGate";
import type { v_537043 } from "../../src/face/faceTurnJudge";

const v_f1a0c2 = (v_ca1ec5, v_963980 = 0, quality: v_537043["quality"] = "ok"): v_537043 => ({
  personId: v_ca1ec5,
  score: v_ca1ec5 == null ? 0.3 : 0.8,
  quality: v_c6feb4,
  atMs: v_963980,
});

function v_9a4ebd() {
  const v_b1b543 = jest.fn();
  const v_98ce98 = v_a3f569({ burst: v_b1b543, now: () => Date.now() });
  return { burst: v_b1b543, gate: v_98ce98 };
}

describe("createTurnFaceGate — say 전송 보류(최대 1초)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  type R = Awaited<ReturnType<ReturnType<typeof v_a3f569>["awaitVerdict"]>>;

  test("hold limit is 1000ms", () => expect(v_692765).toBe(1000));

  test("3 samples ready resolves immediately without burst", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(1, 1));
    v_98ce98.addSample(v_f1a0c2(1, 2));
    v_98ce98.addSample(v_f1a0c2(1, 3));
    const v_df0713 = await v_98ce98.awaitVerdict(1);
    expect(v_df0713.samples.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([1, 2, 3]);
    expect(v_df0713.verdict).toMatchObject({ kind: "known", personId: 1 });
    expect(v_b1b543).not.toHaveBeenCalled();
  });

  test("이름 있는 다른 사람 1개 → 바로 switch(최종 인식 기준), burst 없음", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(2, 1));
    const v_df0713 = await v_98ce98.awaitVerdict(1);
    expect(v_df0713.verdict).toMatchObject({ kind: "switch", personId: 2 });
    expect(v_b1b543).not.toHaveBeenCalled();
  });

  test("모르는 얼굴 1개 → burst(2), 모르는 얼굴 3개가 모이면 unknown", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(null, 1));
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(1).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    expect(v_b1b543).toHaveBeenCalledWith(2);
    v_98ce98.addSample(v_f1a0c2(null, 2));
    await Promise.resolve();
    expect(v_1794cd).toBeNull();
    v_98ce98.addSample(v_f1a0c2(null, 3));
    await Promise.resolve();
    expect(v_1794cd!.samples.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([1, 2, 3]);
    expect(v_1794cd!.verdict).toMatchObject({ kind: "unknown" });
  });

  test("0 samples → burst(3)", () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    void v_98ce98.awaitVerdict(1);
    expect(v_b1b543).toHaveBeenCalledWith(3);
  });

  test("resolves after 1000ms with fewer samples → insufficient", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(null, 1));
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(1).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(v_1794cd).toBeNull();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(v_1794cd!.samples).toEqual([v_f1a0c2(null, 1)]);

    expect(v_1794cd!.verdict).toMatchObject({ kind: "known", personId: 1, score: null });
  });

  test("startTurn clears previous turn samples", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.addSample(v_f1a0c2(1, 1));
    v_98ce98.addSample(v_f1a0c2(1, 2));
    v_98ce98.addSample(v_f1a0c2(1, 3));
    v_98ce98.startTurn();
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(1).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    expect(v_b1b543).toHaveBeenCalledWith(3);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(v_1794cd!.samples).toEqual([]);
  });

  test("keeps only the most recent 3 samples", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    [1, 2, 3, 4, 5].forEach((v_8d41d7) => v_98ce98.addSample(v_f1a0c2(2, v_8d41d7)));
    const v_df0713 = await v_98ce98.awaitVerdict(1);
    expect(v_df0713.samples.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([3, 4, 5]);
  });

  test("resolved array is a copy (later samples do not mutate it)", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    [1, 2, 3].forEach((v_8d41d7) => v_98ce98.addSample(v_f1a0c2(1, v_8d41d7)));
    const v_df0713 = await v_98ce98.awaitVerdict(1);
    v_98ce98.addSample(v_f1a0c2(2, 9));
    expect(v_df0713.samples.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([1, 2, 3]);
  });

  test("holdMs override is respected", async () => {
    const v_b1b543 = jest.fn();
    const v_98ce98 = v_a3f569({ burst: v_b1b543, now: () => Date.now(), holdMs: 200 });
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(null).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    jest.advanceTimersByTime(200);
    await Promise.resolve();
    expect(v_1794cd!.samples).toEqual([]);
  });

  test("timer is cleared once ready (no late double resolve side effects)", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    const v_e2a85c = v_98ce98.awaitVerdict(1);
    [1, 2, 3].forEach((v_8d41d7) => v_98ce98.addSample(v_f1a0c2(2, v_8d41d7)));
    await v_e2a85c;
    expect(jest.getTimerCount()).toBe(0);
  });

  test("a current-speaker sample already collected → immediate known, no burst", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample({ personId: 1, score: 0.62, quality: "ok", atMs: 1 });
    v_98ce98.addSample({ personId: null, score: 0.2, quality: "dark", atMs: 2 });
    const v_df0713 = await v_98ce98.awaitVerdict(1);

    expect(v_df0713.verdict).toEqual({ kind: "known", personId: 1, score: 0.62, quality: "dark" });
    expect(v_b1b543).not.toHaveBeenCalled();
  });

  test("a current-speaker sample arriving while held resolves at once with max score", async () => {
    const v_877566 = jest.fn();
    const v_b1b543 = jest.fn();
    const v_98ce98 = v_a3f569({ burst: v_b1b543, stopBurst: v_877566, now: () => Date.now() });
    v_98ce98.startTurn();
    v_98ce98.addSample({ personId: 1, score: 0.55, quality: "ok", atMs: 1 });
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(1).then((v_fd5f43) => { v_1794cd = v_fd5f43; });

    await Promise.resolve();
    expect(v_1794cd!.verdict).toEqual({ kind: "known", personId: 1, score: 0.55, quality: "ok" });

    v_1794cd = null;
    v_98ce98.startTurn();
    v_98ce98.addSample({ personId: null, score: 0.3, quality: "ok", atMs: 2 });
    void v_98ce98.awaitVerdict(1).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    expect(v_b1b543).toHaveBeenLastCalledWith(2);
    v_98ce98.addSample({ personId: 1, score: 0.66, quality: "small", atMs: 3 });
    await Promise.resolve();
    expect(v_1794cd!.verdict).toEqual({ kind: "known", personId: 1, score: 0.66, quality: "small" });
    expect(v_1794cd!.samples).toHaveLength(2);
    expect(v_877566).toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("no current speaker: one named sample → immediate switch to that person (first turn)", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(163, 1));
    const v_cb35cb = await v_98ce98.awaitVerdict(null);
    expect(v_cb35cb.verdict).toMatchObject({ kind: "switch", personId: 163, score: 0.8 });
    expect(v_b1b543).not.toHaveBeenCalled();
  });

  test("no current speaker: a named sample arriving while held resolves at once", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(null).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    v_98ce98.addSample(v_f1a0c2(163, 1));
    await Promise.resolve();
    expect(v_1794cd!.verdict).toMatchObject({ kind: "switch", personId: 163 });
  });

  test("no current speaker: a no-face sample does not block the first-turn switch", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(null, 1, "none"));
    v_98ce98.addSample(v_f1a0c2(163, 2));
    const v_cb35cb = await v_98ce98.awaitVerdict(null);
    expect(v_cb35cb.verdict).toMatchObject({ kind: "switch", personId: 163 });
  });

  test("no current speaker: only no-face samples → not early", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(null, 1, "none"));
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(null).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    await Promise.resolve();
    expect(v_1794cd).toBeNull();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(v_1794cd!.verdict.kind).toBe("insufficient");
  });

  test("no current speaker: 모르는 얼굴 뒤에 이름 있는 얼굴 → 바로 그 사람으로 switch", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(null, 1));
    v_98ce98.addSample(v_f1a0c2(163, 2));
    const v_df0713 = await v_98ce98.awaitVerdict(null);
    expect(v_df0713.verdict).toMatchObject({ kind: "switch", personId: 163 });
  });

  test("no current speaker: unknown samples (personId null) never count as current", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(null, 1));
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(null).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    expect(v_b1b543).toHaveBeenCalledWith(2);
    await Promise.resolve();
    expect(v_1794cd).toBeNull();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(v_1794cd!.verdict.kind).toBe("insufficient");
  });
});

describe("retryVerdict — 재대조 1회 결과", () => {
  test("no face → insufficient with quality none", () =>
    expect(v_febfc7(v_f1a0c2(null, 0, "none"), 1)).toEqual({
      kind: "insufficient", personId: null, score: null, quality: "none",
    }));

  test("face but no match → unknown with score", () =>
    expect(v_febfc7({ personId: null, score: 0.42, quality: "ok", atMs: 0 }, 1)).toEqual({
      kind: "unknown", personId: null, score: 0.42, quality: "ok",
    }));
  test("어두운 화면의 불일치 → insufficient(제대로 보인 얼굴이 아니다)", () =>
    expect(v_febfc7({ personId: null, score: 0.42, quality: "dark", atMs: 0 }, 1)).toEqual({
      kind: "insufficient", personId: null, score: null, quality: "dark",
    }));

  test("same as current → known", () =>
    expect(v_febfc7(v_f1a0c2(1), 1)).toMatchObject({ kind: "known", personId: 1, score: 0.8 }));

  test("different person → switch", () =>
    expect(v_febfc7(v_f1a0c2(2), 1)).toMatchObject({ kind: "switch", personId: 2 }));

  test("no current speaker → switch (first identification)", () =>
    expect(v_febfc7(v_f1a0c2(2), null)).toMatchObject({ kind: "switch", personId: 2 }));
});

describe("createWhoRetryArm — 재대조 결과 대기(3초 한도)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("timeout is 3000ms", () => expect(v_2faee6).toBe(3000));

  test("request → consumed → next cycle is the retry result (once)", () => {
    const v_7d5140 = v_e7eefa();
    v_7d5140.requested();
    expect(v_7d5140.take()).toBe(false); 
    v_7d5140.consumed();
    expect(v_7d5140.take()).toBe(true);
    expect(v_7d5140.take()).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("no result within 3000ms → cleared; a later unrelated cycle is not the retry result", () => {
    const v_80b283 = jest.fn();
    const v_7d5140 = v_e7eefa({ onExpire: v_80b283 });
    v_7d5140.requested();
    v_7d5140.consumed();
    jest.advanceTimersByTime(2999);
    expect(v_80b283).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(v_80b283).toHaveBeenCalledTimes(1);
    expect(v_7d5140.take()).toBe(false);

    v_7d5140.consumed();
    expect(v_7d5140.take()).toBe(false);
  });

  test("clear drops the wait without onExpire", () => {
    const v_80b283 = jest.fn();
    const v_7d5140 = v_e7eefa({ onExpire: v_80b283 });
    v_7d5140.requested();
    v_7d5140.consumed();
    v_7d5140.clear();
    jest.advanceTimersByTime(5000);
    expect(v_7d5140.take()).toBe(false);
    expect(v_80b283).not.toHaveBeenCalled();
  });

  test("consumed without a live request does nothing", () => {
    const v_7d5140 = v_e7eefa();
    v_7d5140.consumed();
    expect(v_7d5140.take()).toBe(false);
  });
});

import { v_c63cdb, v_c68f2a } from "../../src/face/turnFaceGate";

describe("judgeWho", () => {
  test("현재 화자 얼굴이 하나라도 있으면 known", () =>
    expect(v_c63cdb([v_f1a0c2(null), v_f1a0c2(7)], 7)).toMatchObject({ kind: "known", personId: 7 }));
  test("다른 이름 있는 사람 → switch", () =>
    expect(v_c63cdb([v_f1a0c2(9)], 7)).toMatchObject({ kind: "switch", personId: 9 }));
  test("얼굴은 있는데 일치 없음 → unknown", () =>
    expect(v_c63cdb([v_f1a0c2(null), v_f1a0c2(null)], 7)).toMatchObject({ kind: "unknown", personId: null }));
  test("얼굴 없음뿐 → insufficient", () =>
    expect(v_c63cdb([v_f1a0c2(null, 0, "none")], 7)).toMatchObject({ kind: "insufficient", quality: "none" }));
  test("어두운 화면의 불일치는 근거가 아니다 → insufficient(quality 는 마지막 표본)", () =>
    expect(v_c63cdb([v_f1a0c2(null, 0, "dark")], null)).toMatchObject({ kind: "insufficient", quality: "dark" }));
});

describe("awaitWhoVerdict", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("hold 는 2500ms", () => expect(v_c68f2a).toBe(2500));

  test("이름 있는 얼굴 1개면 바로 넘긴다 + burst 는 2.5초 한도로 요청", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    let v_cb35cb = null;
    void v_98ce98.awaitWhoVerdict(7).then((v_62c214) => { v_cb35cb = v_62c214; });
    expect(v_b1b543).toHaveBeenCalledWith(3, 2500);
    v_98ce98.addSample(v_f1a0c2(7));
    await Promise.resolve();
    expect(v_cb35cb.verdict.kind).toBe("known");
  });

  test("모르는 얼굴은 2개 모이면 넘긴다(1개로는 안 넘김)", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    let v_cb35cb = null;
    void v_98ce98.awaitWhoVerdict(7).then((v_62c214) => { v_cb35cb = v_62c214; });
    v_98ce98.addSample(v_f1a0c2(null));
    await Promise.resolve();
    expect(v_cb35cb).toBeNull();
    v_98ce98.addSample(v_f1a0c2(null));
    await Promise.resolve();
    expect(v_cb35cb.verdict.kind).toBe("unknown");
  });

  test("2.5초 안에 얼굴이 하나도 없으면 insufficient, 모르는 얼굴 1개면 unknown", async () => {
    const v_779914 = v_9a4ebd();
    v_779914.gate.startTurn();
    let v_2d1eeb = null;
    void v_779914.gate.awaitWhoVerdict(7).then((v_62c214) => { v_2d1eeb = v_62c214; });
    jest.advanceTimersByTime(2499);
    await Promise.resolve();
    expect(v_2d1eeb).toBeNull();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(v_2d1eeb.verdict.kind).toBe("insufficient");

    const v_148ff6 = v_9a4ebd();
    v_148ff6.gate.startTurn();
    v_148ff6.gate.addSample(v_f1a0c2(null));
    let v_b96973 = null;
    void v_148ff6.gate.awaitWhoVerdict(7).then((v_62c214) => { v_b96973 = v_62c214; });
    jest.advanceTimersByTime(2500);
    await Promise.resolve();
    expect(v_b96973.verdict.kind).toBe("unknown");
  });
});

describe("점수 0.1 이하 불일치는 판정 불가", () => {
  const v_728123 = (v_740dd8, quality: v_537043["quality"] = "dark"): v_537043 => ({ personId: null, score: v_740dd8, quality: v_c6feb4, atMs: 0 });
  test("judgeWho — 비켜선 본인(어두운 화면 0.101·0.095) → insufficient", () =>
    expect(v_c63cdb([v_728123(0.101), v_728123(0.095)], 175)).toMatchObject({ kind: "insufficient", quality: "dark" }));
  test("judgeWho — 0.1 초과 불일치(사진 0.13)는 그대로 unknown", () =>
    expect(v_c63cdb([v_728123(0.13, "ok")], 175)).toMatchObject({ kind: "unknown" }));
  test("judgeWho — 낮은 불일치가 섞여도 현재 화자 표본이 있으면 known", () =>
    expect(v_c63cdb([v_728123(0.05), v_f1a0c2(175)], 175)).toMatchObject({ kind: "known", personId: 175 }));
  test("judgeWho — 화면 좋아도 0.1 이하 불일치는 insufficient", () =>
    expect(v_c63cdb([v_728123(0.1, "ok")], 175)).toMatchObject({ kind: "insufficient" }));
  test("retryVerdict — 0.08 불일치 → insufficient", () =>
    expect(v_febfc7(v_728123(0.08, "ok"), 175)).toEqual({ kind: "insufficient", personId: null, score: null, quality: "ok" }));
});
