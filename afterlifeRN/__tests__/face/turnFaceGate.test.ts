import { v_a3f569, v_febfc7, v_692765 } from "../../src/face/turnFaceGate";
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

  test("hold limit is 1000ms", () => expect(v_692765).toBe(1000));

  test("3 samples ready resolves immediately without burst", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(1, 1));
    v_98ce98.addSample(v_f1a0c2(1, 2));
    v_98ce98.addSample(v_f1a0c2(1, 3));
    const v_df0713 = await v_98ce98.awaitReady();
    expect(v_df0713.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([1, 2, 3]);
    expect(v_b1b543).not.toHaveBeenCalled();
  });

  test("1 sample → burst(2) and resolves when 3 arrive", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(1, 1));
    let resolved: v_537043[] | null = null;
    void v_98ce98.awaitReady().then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    expect(v_b1b543).toHaveBeenCalledWith(2);
    v_98ce98.addSample(v_f1a0c2(1, 2));
    await Promise.resolve();
    expect(v_1794cd).toBeNull();
    v_98ce98.addSample(v_f1a0c2(1, 3));
    await Promise.resolve();
    expect(v_1794cd).not.toBeNull();
    expect(v_1794cd!.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([1, 2, 3]);
  });

  test("0 samples → burst(3)", () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    void v_98ce98.awaitReady();
    expect(v_b1b543).toHaveBeenCalledWith(3);
  });

  test("resolves after 1000ms with fewer samples", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    v_98ce98.addSample(v_f1a0c2(1, 1));
    let resolved: v_537043[] | null = null;
    void v_98ce98.awaitReady().then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(v_1794cd).toBeNull();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(v_1794cd).toEqual([v_f1a0c2(1, 1)]);
  });

  test("startTurn clears previous turn samples", async () => {
    const { burst: v_b1b543, gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.addSample(v_f1a0c2(1, 1));
    v_98ce98.addSample(v_f1a0c2(1, 2));
    v_98ce98.addSample(v_f1a0c2(1, 3));
    v_98ce98.startTurn();
    let resolved: v_537043[] | null = null;
    void v_98ce98.awaitReady().then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    expect(v_b1b543).toHaveBeenCalledWith(3);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(v_1794cd).toEqual([]);
  });

  test("keeps only the most recent 3 samples", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    [1, 2, 3, 4, 5].forEach((v_8d41d7) => v_98ce98.addSample(v_f1a0c2(1, v_8d41d7)));
    const v_df0713 = await v_98ce98.awaitReady();
    expect(v_df0713.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([3, 4, 5]);
  });

  test("resolved array is a copy (later samples do not mutate it)", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    [1, 2, 3].forEach((v_8d41d7) => v_98ce98.addSample(v_f1a0c2(1, v_8d41d7)));
    const v_df0713 = await v_98ce98.awaitReady();
    v_98ce98.addSample(v_f1a0c2(2, 9));
    expect(v_df0713.map((v_fd5f43) => v_fd5f43.atMs)).toEqual([1, 2, 3]);
  });

  test("holdMs override is respected", async () => {
    const v_b1b543 = jest.fn();
    const v_98ce98 = v_a3f569({ burst: v_b1b543, now: () => Date.now(), holdMs: 200 });
    let resolved: v_537043[] | null = null;
    void v_98ce98.awaitReady().then((v_fd5f43) => { v_1794cd = v_fd5f43; });
    jest.advanceTimersByTime(200);
    await Promise.resolve();
    expect(v_1794cd).toEqual([]);
  });

  test("timer is cleared once ready (no late double resolve side effects)", async () => {
    const { gate: v_98ce98 } = v_9a4ebd();
    v_98ce98.startTurn();
    const v_e2a85c = v_98ce98.awaitReady();
    [1, 2, 3].forEach((v_8d41d7) => v_98ce98.addSample(v_f1a0c2(1, v_8d41d7)));
    await v_e2a85c;
    expect(jest.getTimerCount()).toBe(0);
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
