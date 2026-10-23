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

  test("1 sample (not current) → burst(2) and resolves when 3 arrive", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(2, 1));
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(1).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    expect(v_b1b543).toHaveBeenCalledWith(2);
    v_98ce98.addSample(v_f1a0c2(2, 2));
    await Promise.resolve();
    expect(v_1794cd).toBeNull();
    v_98ce98.addSample(v_f1a0c2(2, 3));
    await Promise.resolve();
    expect(v_1794cd).not.toBeNull();
    expect(v_1794cd!.samples.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([1, 2, 3]);
    expect(v_1794cd!.verdict).toMatchObject({ kind: "switch", personId: 2 });
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
    expect(v_1794cd!.verdict.kind).toBe("insufficient");
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
    v_98ce98.addSample({ personId: 2, score: 0.7, quality: "ok", atMs: 2 });
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

  test("no current speaker: named + unknown-face mixed → not early (waits, then insufficient)", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(null, 1));
    v_98ce98.addSample(v_f1a0c2(163, 2));
    let v_1794cd = null;
    void v_98ce98.awaitVerdict(null).then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    await Promise.resolve();
    expect(v_1794cd).toBeNull();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(v_1794cd!.verdict.kind).toBe("insufficient");
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
    expect(v_febfc7({ personId: null, score: 0.42, quality: "dark", atMs: 0 }, 1)).toEqual({
      kind: "unknown", personId: null, score: 0.42, quality: "dark",
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
