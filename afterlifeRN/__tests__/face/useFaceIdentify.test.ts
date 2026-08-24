

jest.mock("@react-native-async-storage/async-storage", () =>
  require("../helpers/mockAsyncStorage").asyncStorageMock(),
);

import { renderHook, waitFor } from "@testing-library/react-native";
import {
  runIdentifyCycle,
  useFaceIdentify,
  deriveVerdict,
  INITIAL_IDENTIFY_CYCLE_STATE,
  NETWORK_FAIL_BACKOFF_THRESHOLD,
  NETWORK_FAIL_BACKOFF_MS,
  type IdentifyCycleState,
} from "../../src/face/useFaceIdentify";

const VEC = new Array(512).fill(0).map((_, i) => (i === 0 ? 1 : 0));

const EMBEDDING_INTERVAL_MS = 10_000;

describe("deriveVerdict", () => {
  it("confirmed 상태", () => {
    expect(deriveVerdict({ confirmed: 5, candidate: null, streak: 0 })).toBe("confirmed");
  });
  it("candidate 진행중", () => {
    expect(deriveVerdict({ confirmed: "none", candidate: 5, streak: 2 })).toBe("candidate");
  });
  it("Fix 1 — 미상 확정(confirmed==='unknown')은 candidate/confirmed 아닌 unknown", () => {
    expect(deriveVerdict({ confirmed: "unknown", candidate: null, streak: 3 })).toBe("unknown");
  });
  it("none", () => {
    expect(deriveVerdict({ confirmed: "none", candidate: null, streak: 0 })).toBe("none");
  });
});

describe("runIdentifyCycle (순수 로직)", () => {
  it("matchFace 가 personId 를 반환하면 **1회에** speaker_confirmed", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 3, displayName: "철수", score: 0.9 },
      threshold: 0.5,
    });
    let s: IdentifyCycleState = INITIAL_IDENTIFY_CYCLE_STATE;

    let r = await runIdentifyCycle(s, VEC, "tok", 999, 1000, { matchFaceFn });
    expect(r.event).toEqual({ type: "speaker_confirmed", personId: 3, displayName: "철수" });
    s = r.state;

    r = await runIdentifyCycle(s, VEC, "tok", 999, 4000, { matchFaceFn });
    expect(r.event).toBeNull();
    s = r.state;

    r = await runIdentifyCycle(s, VEC, "tok", 999, 7000, { matchFaceFn });
    expect(r.event).toBeNull();

    expect(matchFaceFn).toHaveBeenCalledTimes(3);
  });

  it("best 가 null(미매치)이면 **1회에** unknown_face", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    const s: IdentifyCycleState = INITIAL_IDENTIFY_CYCLE_STATE;
    const r = await runIdentifyCycle(s, VEC, "tok", 999, 1000, { matchFaceFn });
    expect(r.event).toEqual({ type: "unknown_face", score: 0 });
  });

  it("matchFace 실패(네트워크) → 사이클 스킵, event null, 크래시 없음", async () => {
    const matchFaceFn = jest.fn().mockRejectedValue(new Error("network"));
    const s: IdentifyCycleState = INITIAL_IDENTIFY_CYCLE_STATE;
    const r = await runIdentifyCycle(s, VEC, "tok", 999, 1000, { matchFaceFn });
    expect(r.event).toBeNull();
    expect(r.state.consecutiveFailures).toBe(1);
    expect(r.state.speaker).toEqual(INITIAL_IDENTIFY_CYCLE_STATE.speaker); 
  });

  it("연속 실패가 임계치 도달 → backoffUntilMs 설정, 이후 사이클은 matchFaceFn 호출 없이 스킵", async () => {
    const matchFaceFn = jest.fn().mockRejectedValue(new Error("network"));
    let s: IdentifyCycleState = INITIAL_IDENTIFY_CYCLE_STATE;
    let now = 0;
    for (let i = 0; i < NETWORK_FAIL_BACKOFF_THRESHOLD; i++) {
      now += 100;
      const r = await runIdentifyCycle(s, VEC, "tok", 999, now, { matchFaceFn });
      s = r.state;
    }
    expect(s.consecutiveFailures).toBe(NETWORK_FAIL_BACKOFF_THRESHOLD);
    expect(s.backoffUntilMs).toBe(now + NETWORK_FAIL_BACKOFF_MS);

    const callsBefore = matchFaceFn.mock.calls.length;
    const r2 = await runIdentifyCycle(s, VEC, "tok", 999, now + 1, { matchFaceFn });
    expect(matchFaceFn.mock.calls.length).toBe(callsBefore);
    expect(r2.event).toBeNull();
    expect(r2.state).toBe(s); 
  });

  it("백오프 종료 후 성공 사이클 → consecutiveFailures/backoff 리셋", async () => {
    const matchFaceFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("n1"))
      .mockRejectedValueOnce(new Error("n2"))
      .mockRejectedValueOnce(new Error("n3"))
      .mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    let s: IdentifyCycleState = INITIAL_IDENTIFY_CYCLE_STATE;
    let now = 0;
    for (let i = 0; i < 3; i++) {
      now += 100;
      const r = await runIdentifyCycle(s, VEC, "tok", 999, now, { matchFaceFn });
      s = r.state;
    }
    expect(s.backoffUntilMs).toBeGreaterThan(now);

    now = s.backoffUntilMs + 1; 
    const r = await runIdentifyCycle(s, VEC, "tok", 999, now, { matchFaceFn });
    expect(r.state.consecutiveFailures).toBe(0);
    expect(r.state.backoffUntilMs).toBe(0);
  });

  it("T-252 — unknown 이 계속되면 재발행 주기마다 unknown_face 가 다시 나온다", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    let s: IdentifyCycleState = INITIAL_IDENTIFY_CYCLE_STATE;
    const emitted: number[] = [];

    for (let t = 0; t <= 180_000; t += EMBEDDING_INTERVAL_MS) {
      const r = await runIdentifyCycle(s, VEC, "tok", 999, t, { matchFaceFn });
      s = r.state;
      if (r.event) {
        expect(r.event).toEqual({ type: "unknown_face", score: 0 });
        emitted.push(t);
      }
    }

    expect(emitted).toEqual([0, 60_000, 120_000, 180_000]);
  });
});

describe("useFaceIdentify (훅 오케스트레이션)", () => {
  it("onEmbedding 3연속 호출(동일 personId) → onEvent(speaker_confirmed) 1회", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 7, displayName: "영희", score: 0.95 },
      threshold: 0.5,
    });
    const onEvent = jest.fn();
    let t = 0;
    const { result } = renderHook(() =>
      useFaceIdentify({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent,
        deps: { matchFaceFn },
        now: () => (t += 1000),
      }),
    );

    result.current.onEmbedding(VEC);
    await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(1));
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(2));
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(onEvent).toHaveBeenCalledTimes(1));

    expect(onEvent).toHaveBeenCalledWith({ type: "speaker_confirmed", personId: 7, displayName: "영희" });
  });

  it("enabled=false → onEmbedding 호출해도 matchFaceFn 미호출", () => {
    const matchFaceFn = jest.fn();
    const { result } = renderHook(() =>
      useFaceIdentify({ enabled: false, accessToken: "tok", cloneId: 999, onEvent: jest.fn(), deps: { matchFaceFn } }),
    );
    result.current.onEmbedding(VEC);
    expect(matchFaceFn).not.toHaveBeenCalled();
  });

  it("리뷰 fix(버그1) — enabled=false 동안 onEmbedding 호출은 무시되다가, enabled=true 로 바뀐 뒤엔 정상 동작", async () => {

    const matchFaceFn = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 5, displayName: "동수", score: 0.9 },
      threshold: 0.5,
    });
    const onEvent = jest.fn();
    const { result, rerender } = renderHook<
      ReturnType<typeof useFaceIdentify>,
      { enabled: boolean }
    >(
      ({ enabled }) =>
        useFaceIdentify({ enabled, accessToken: "tok", cloneId: 999, onEvent, deps: { matchFaceFn } }),
      { initialProps: { enabled: false } },
    );

    result.current.onEmbedding(VEC);
    result.current.onEmbedding(VEC);
    expect(matchFaceFn).not.toHaveBeenCalled();
    expect(onEvent).not.toHaveBeenCalled();

    rerender({ enabled: true });
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(1));
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(2));
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(onEvent).toHaveBeenCalledTimes(1));
    expect(onEvent).toHaveBeenCalledWith({ type: "speaker_confirmed", personId: 5, displayName: "동수" });
  });

  it("getBuffer() 로 최근 벡터 확인 가능(EmbeddingBuffer 사이드이펙트)", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    const { result } = renderHook(() =>
      useFaceIdentify({ enabled: true, accessToken: "tok", cloneId: 999, onEvent: jest.fn(), deps: { matchFaceFn } }),
    );
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(1));
    expect(result.current.getBuffer().latest(1)).toHaveLength(1);
  });

  it("T-111 계측 — onDiag가 FaceDiag로 호출되고 calibrateFn이 벡터·groundTruthPersonId로 불림", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 9, displayName: "지수", score: 0.81 },
      threshold: 0.83,
    });
    const calibrateFn = jest.fn().mockResolvedValue({
      id: 1,
      matchedId: "9",
      bestScore: 0.81,
      threshold: 0.83,
      scoreCount: 1,
    });
    const onDiag = jest.fn();
    const { result } = renderHook(() =>
      useFaceIdentify({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: jest.fn(),
        onDiag,
        calibrate: { accessToken: "tok", groundTruthPersonId: 5 },
        deps: { matchFaceFn, calibrateFn },
      }),
    );

    result.current.onEmbedding(VEC);
    await waitFor(() => expect(onDiag).toHaveBeenCalledTimes(1));

    expect(onDiag).toHaveBeenCalledWith({
      score: 0.81,
      personId: 9,
      displayName: "지수",
      streak: 1,

      verdict: "confirmed",
      threshold: 0.83,
    });

    await waitFor(() => expect(calibrateFn).toHaveBeenCalledTimes(1));

    expect(calibrateFn).toHaveBeenCalledWith("tok", VEC, 5, 999);
  });

  it("계측 상시 전송 — groundTruthPersonId 가 null 이어도 매 사이클 calibrateFn 이 불린다", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 9, displayName: "지수", score: 0.81 },
      threshold: 0.83,
    });
    const calibrateFn = jest.fn().mockResolvedValue({
      id: 1,
      matchedId: "9",
      bestScore: 0.81,
      threshold: 0.83,
      scoreCount: 1,
      matchedHasL2p: false,
    });
    const { result } = renderHook(() =>
      useFaceIdentify({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: jest.fn(),

        calibrate: { accessToken: "tok", groundTruthPersonId: null },
        deps: { matchFaceFn, calibrateFn },
      }),
    );

    result.current.onEmbedding(VEC);
    await waitFor(() => expect(calibrateFn).toHaveBeenCalledTimes(1));
    expect(calibrateFn).toHaveBeenCalledWith("tok", VEC, null, 999);

    result.current.onEmbedding(VEC);
    await waitFor(() => expect(calibrateFn).toHaveBeenCalledTimes(2));
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(calibrateFn).toHaveBeenCalledTimes(3));
  });

  it("계측은 onDiag 소비자가 없어도(HUD 미표시) 전송된다 — 진단 블록과 분리", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({
      matches: [],
      best: null,
      threshold: 0.83,
    });
    const calibrateFn = jest.fn().mockResolvedValue({
      id: 2,
      matchedId: null,
      bestScore: 0.1,
      threshold: 0.83,
      scoreCount: 0,
      matchedHasL2p: null,
    });
    const { result } = renderHook(() =>
      useFaceIdentify({
        enabled: true,
        accessToken: "tok",
        cloneId: 12,
        onEvent: jest.fn(),

        calibrate: { accessToken: "tok", groundTruthPersonId: null },
        deps: { matchFaceFn, calibrateFn },
      }),
    );
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(calibrateFn).toHaveBeenCalledTimes(1));
    expect(calibrateFn).toHaveBeenCalledWith("tok", VEC, null, 12);
  });

  it("게이트 off(calibrate 미지정) → calibrateFn 미호출", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 9, displayName: "지수", score: 0.81 },
      threshold: 0.83,
    });
    const calibrateFn = jest.fn();
    const { result } = renderHook(() =>
      useFaceIdentify({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: jest.fn(),
        deps: { matchFaceFn, calibrateFn },
      }),
    );
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(1));
    expect(calibrateFn).not.toHaveBeenCalled();
  });

  it("계측 전송이 실패해도(rejected) 인식 루프는 계속 돈다 — fire-and-forget", async () => {
    const matchFaceFn = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 4, displayName: "민수", score: 0.9 },
      threshold: 0.5,
    });

    const calibrateFn = jest.fn().mockRejectedValue(new Error("400 invalid cloneId"));
    const onEvent = jest.fn();
    const { result } = renderHook(() =>
      useFaceIdentify({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent,
        calibrate: { accessToken: "tok", groundTruthPersonId: null },
        deps: { matchFaceFn, calibrateFn },
      }),
    );

    result.current.onEmbedding(VEC);
    await waitFor(() => expect(calibrateFn).toHaveBeenCalledTimes(1));
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(calibrateFn).toHaveBeenCalledTimes(2));
    result.current.onEmbedding(VEC);

    await waitFor(() => expect(onEvent).toHaveBeenCalledTimes(1));
    expect(onEvent).toHaveBeenCalledWith({ type: "speaker_confirmed", personId: 4, displayName: "민수" });
  });

  it("네트워크 실패 사이클(cycle 없음)에는 계측을 보내지 않는다 — 백오프 무력화 방지", async () => {
    const matchFaceFn = jest.fn().mockRejectedValue(new Error("network"));
    const calibrateFn = jest.fn();
    const { result } = renderHook(() =>
      useFaceIdentify({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: jest.fn(),
        calibrate: { accessToken: "tok", groundTruthPersonId: null },
        deps: { matchFaceFn, calibrateFn },
      }),
    );
    result.current.onEmbedding(VEC);
    await waitFor(() => expect(matchFaceFn).toHaveBeenCalledTimes(1));
    expect(calibrateFn).not.toHaveBeenCalled();
  });
});
