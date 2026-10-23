

jest.mock("bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv", () =>
  require("../helpers/mockAsyncStorage").asyncStorageMock(),
);

import { v_0da18b, v_81e49f } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import {
  v_f644ce,
  v_e9685b,
  v_10735f,
  v_48b3dc,
  v_65c90d,
  v_dd916a,
  type v_90fd14,
} from "../../src/face/useFaceIdentify";

const v_87d4f2 = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 0 ? 1 : 0));

const v_40dbe0 = 10_000;

describe("deriveVerdict", () => {
  it("confirmed 상태", () => {
    expect(v_10735f({ confirmed: 5, candidate: null, streak: 0 })).toBe("confirmed");
  });
  it("candidate 진행중", () => {
    expect(v_10735f({ confirmed: "none", candidate: 5, streak: 2 })).toBe("candidate");
  });
  it("Fix 1 — 미상 확정(confirmed==='unknown')은 candidate/confirmed 아닌 unknown", () => {
    expect(v_10735f({ confirmed: "unknown", candidate: null, streak: 3 })).toBe("unknown");
  });
  it("none", () => {
    expect(v_10735f({ confirmed: "none", candidate: null, streak: 0 })).toBe("none");
  });
});

describe("runIdentifyCycle (순수 로직)", () => {
  it("selfMatch: best 없이 서버 selfMatch=true 면 true, best 가 있으면 false, 필드 없으면 false", async () => {
    const v_d9b231 = (v_eb792a) =>
      v_f644ce(v_48b3dc, v_87d4f2, "tok", 999, 1000, {
        matchFaceFn: jest.fn().mockResolvedValue(v_eb792a),
      });
    expect((await v_d9b231({ matches: [], best: null, threshold: 0.6, selfMatch: true })).selfMatch).toBe(true);
    expect(
      (await v_d9b231({ matches: [], best: { personId: 3, displayName: "철수", score: 0.9 }, threshold: 0.6, selfMatch: true }))
        .selfMatch,
    ).toBe(false);
    expect((await v_d9b231({ matches: [], best: null, threshold: 0.6 })).selfMatch).toBe(false);
  });

  it("matchFace 가 personId 를 반환하면 **1회에** speaker_confirmed", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 3, displayName: "철수", score: 0.9 },
      threshold: 0.5,
    });
    let s: v_90fd14 = v_48b3dc;

    let v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, 1000, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 3, displayName: "철수" });
    v_fd5f43 = v_cb35cb.state;

    v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, 4000, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.event).toBeNull();
    v_fd5f43 = v_cb35cb.state;

    v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, 7000, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.event).toBeNull();

    expect(v_a97841).toHaveBeenCalledTimes(3);
  });

  it("best 가 null(미매치)이면 **1회에** unknown_face", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    const s: v_90fd14 = v_48b3dc;
    const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, 1000, { matchFaceFn: v_a97841 });

    expect(v_cb35cb.event).toEqual({ type: "unknown_face", score: 0, topPersonId: null });
  });

  it("matchFace 실패(네트워크) → 사이클 스킵, event null, 크래시 없음", async () => {
    const v_a97841 = jest.fn().mockRejectedValue(new Error("network"));
    const s: v_90fd14 = v_48b3dc;
    const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, 1000, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.event).toBeNull();
    expect(v_cb35cb.state.consecutiveFailures).toBe(1);
    expect(v_cb35cb.state.speaker).toEqual(v_48b3dc.speaker); 
  });

  it("연속 실패가 임계치 도달 → backoffUntilMs 설정, 이후 사이클은 matchFaceFn 호출 없이 스킵", async () => {
    const v_a97841 = jest.fn().mockRejectedValue(new Error("network"));
    let s: v_90fd14 = v_48b3dc;
    let v_5c2f9f = 0;
    for (let v_ebec57 = 0; v_ebec57 < v_65c90d; v_ebec57++) {
      v_5c2f9f += 100;
      const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, v_5c2f9f, { matchFaceFn: v_a97841 });
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.consecutiveFailures).toBe(v_65c90d);
    expect(v_fd5f43.backoffUntilMs).toBe(v_5c2f9f + v_dd916a);

    const v_d928af = v_a97841.mock.calls.length;
    const v_b96973 = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, v_5c2f9f + 1, { matchFaceFn: v_a97841 });
    expect(v_a97841.mock.calls.length).toBe(v_d928af);
    expect(v_b96973.event).toBeNull();
    expect(v_b96973.state).toBe(v_fd5f43); 
  });

  it("백오프 종료 후 성공 사이클 → consecutiveFailures/backoff 리셋", async () => {
    const v_a97841 = jest
      .fn()
      .mockRejectedValueOnce(new Error("n1"))
      .mockRejectedValueOnce(new Error("n2"))
      .mockRejectedValueOnce(new Error("n3"))
      .mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    let s: v_90fd14 = v_48b3dc;
    let v_5c2f9f = 0;
    for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
      v_5c2f9f += 100;
      const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, v_5c2f9f, { matchFaceFn: v_a97841 });
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.backoffUntilMs).toBeGreaterThan(v_5c2f9f);

    v_5c2f9f = v_fd5f43.backoffUntilMs + 1; 
    const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, v_5c2f9f, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.state.consecutiveFailures).toBe(0);
    expect(v_cb35cb.state.backoffUntilMs).toBe(0);
  });

  it("T-252 — unknown 이 계속되면 재발행 주기마다 unknown_face 가 다시 나온다", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    let s: v_90fd14 = v_48b3dc;
    const v_96bb97 = [];

    for (let v_8d41d7 = 0; v_8d41d7 <= 180_000; v_8d41d7 += v_40dbe0) {
      const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 999, v_8d41d7, { matchFaceFn: v_a97841 });
      v_fd5f43 = v_cb35cb.state;
      if (v_cb35cb.event) {

        expect(v_cb35cb.event).toEqual({ type: "unknown_face", score: 0, topPersonId: null });
        v_96bb97.push(v_8d41d7);
      }
    }

    expect(v_96bb97).toEqual([
      0, 10_000, 20_000, 30_000, 40_000, 50_000,
      60_000, 70_000, 80_000, 90_000, 100_000, 110_000,
      120_000, 130_000, 140_000, 150_000, 160_000, 170_000, 180_000,
    ]);
  });
});

describe("useFaceIdentify onCycle · 접수 여부 (AFL-1039)", () => {
  it("cycle 마다 onCycle(personId, score, displayName) — score 는 최종 판정 점수", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [{ personId: 7, displayName: "영희", score: 0.81 }],
      best: { personId: 7, displayName: "영희", score: 0.81 },
      threshold: 0.6,
    });
    const v_e028d7 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({ enabled: true, accessToken: "tok", cloneId: 1, onEvent: jest.fn(), onCycle: v_e028d7, deps: { matchFaceFn: v_a97841 } }),
    );
    expect(v_43c42e.current.onEmbedding(v_87d4f2)).toBe(true);
    await v_81e49f(() => expect(v_e028d7).toHaveBeenCalledTimes(1));
    expect(v_e028d7).toHaveBeenCalledWith({ personId: 7, score: 0.81, displayName: "영희" });
  });

  it("일치 없음이면 personId null · score 는 top1 점수", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [{ personId: 3, displayName: "철수", score: 0.31 }],
      best: null,
      threshold: 0.6,
    });
    const v_e028d7 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({ enabled: true, accessToken: "tok", cloneId: 1, onEvent: jest.fn(), onCycle: v_e028d7, deps: { matchFaceFn: v_a97841 } }),
    );
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_e028d7).toHaveBeenCalledTimes(1));
    expect(v_e028d7).toHaveBeenCalledWith({ personId: null, score: 0.31, displayName: null });
  });

  it("네트워크 실패(cycle 없음)면 onCycle 미호출", async () => {
    const v_a97841 = jest.fn().mockRejectedValue(new Error("net"));
    const v_e028d7 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({ enabled: true, accessToken: "tok", cloneId: 1, onEvent: jest.fn(), onCycle: v_e028d7, deps: { matchFaceFn: v_a97841 } }),
    );
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(1));
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 0));
    expect(v_e028d7).not.toHaveBeenCalled();
  });

  it("진행 중 사이클이 있거나 꺼져 있으면 onEmbedding 은 false(접수 안 함)", async () => {
    let v_4b5fe9 = () => {};
    const v_a97841 = jest.fn().mockImplementation(() => new Promise((v_cb35cb) => { v_4b5fe9 = v_cb35cb; }));
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({ enabled: true, accessToken: "tok", cloneId: 1, onEvent: jest.fn(), deps: { matchFaceFn: v_a97841 } }),
    );
    expect(v_43c42e.current.onEmbedding(v_87d4f2)).toBe(true);
    expect(v_43c42e.current.onEmbedding(v_87d4f2)).toBe(false);
    v_4b5fe9({ matches: [], best: null, threshold: 0.6 });
    const v_fa04a0 = v_0da18b(() =>
      v_e9685b({ enabled: false, accessToken: "tok", cloneId: 1, onEvent: jest.fn(), deps: { matchFaceFn: v_a97841 } }),
    );
    expect(v_fa04a0.result.current.onEmbedding(v_87d4f2)).toBe(false);
  });
});

describe("useFaceIdentify (훅 오케스트레이션)", () => {
  it("onEmbedding 3연속 호출(동일 personId) → onEvent(speaker_confirmed) 1회", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 7, displayName: "영희", score: 0.95 },
      threshold: 0.5,
    });
    const v_68885c = jest.fn();
    let v_8d41d7 = 0;
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: v_68885c,
        deps: { matchFaceFn: v_a97841 },
        now: () => (v_8d41d7 += 1000),
      }),
    );

    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(1));
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(2));
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_68885c).toHaveBeenCalledTimes(1));

    expect(v_68885c).toHaveBeenCalledWith({ type: "speaker_confirmed", personId: 7, displayName: "영희" });
  });

  it("enabled=false → onEmbedding 호출해도 matchFaceFn 미호출", () => {
    const v_a97841 = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({ enabled: false, accessToken: "tok", cloneId: 999, onEvent: jest.fn(), deps: { matchFaceFn: v_a97841 } }),
    );
    v_43c42e.current.onEmbedding(v_87d4f2);
    expect(v_a97841).not.toHaveBeenCalled();
  });

  it("리뷰 fix(버그1) — enabled=false 동안 onEmbedding 호출은 무시되다가, enabled=true 로 바뀐 뒤엔 정상 동작", async () => {

    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 5, displayName: "동수", score: 0.9 },
      threshold: 0.5,
    });
    const v_68885c = jest.fn();
    const { result: v_43c42e, rerender: v_2726cb } = v_0da18b<
      ReturnType<typeof v_e9685b>,
      { enabled: boolean }
    >(
      ({ enabled: v_d20c84 }) =>
        v_e9685b({ enabled: v_d20c84, accessToken: "tok", cloneId: 999, onEvent: v_68885c, deps: { matchFaceFn: v_a97841 } }),
      { initialProps: { enabled: false } },
    );

    v_43c42e.current.onEmbedding(v_87d4f2);
    v_43c42e.current.onEmbedding(v_87d4f2);
    expect(v_a97841).not.toHaveBeenCalled();
    expect(v_68885c).not.toHaveBeenCalled();

    v_2726cb({ enabled: true });
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(1));
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(2));
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_68885c).toHaveBeenCalledTimes(1));
    expect(v_68885c).toHaveBeenCalledWith({ type: "speaker_confirmed", personId: 5, displayName: "동수" });
  });

  it("getBuffer() 로 최근 벡터 확인 가능(EmbeddingBuffer 사이드이펙트)", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({ enabled: true, accessToken: "tok", cloneId: 999, onEvent: jest.fn(), deps: { matchFaceFn: v_a97841 } }),
    );
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(1));
    expect(v_43c42e.current.getBuffer().latest(1)).toHaveLength(1);
  });

  it("T-111 계측 — onDiag가 FaceDiag로 호출되고 calibrateFn이 벡터·groundTruthPersonId로 불림", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 9, displayName: "지수", score: 0.81 },
      threshold: 0.83,
    });
    const v_7db14d = jest.fn().mockResolvedValue({
      id: 1,
      matchedId: "9",
      bestScore: 0.81,
      threshold: 0.83,
      scoreCount: 1,
    });
    const v_32837c = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: jest.fn(),
        onDiag: v_32837c,
        calibrate: { accessToken: "tok", groundTruthPersonId: 5 },
        deps: { matchFaceFn: v_a97841, calibrateFn: v_7db14d },
      }),
    );

    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_32837c).toHaveBeenCalledTimes(1));

    expect(v_32837c).toHaveBeenCalledWith({
      score: 0.81,
      personId: 9,
      displayName: "지수",
      streak: 1,

      verdict: "confirmed",
      threshold: 0.83,
    });

    await v_81e49f(() => expect(v_7db14d).toHaveBeenCalledTimes(1));

    expect(v_7db14d).toHaveBeenCalledWith("tok", v_87d4f2, 5, 999);
  });

  it("계측 상시 전송 — groundTruthPersonId 가 null 이어도 매 사이클 calibrateFn 이 불린다", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 9, displayName: "지수", score: 0.81 },
      threshold: 0.83,
    });
    const v_7db14d = jest.fn().mockResolvedValue({
      id: 1,
      matchedId: "9",
      bestScore: 0.81,
      threshold: 0.83,
      scoreCount: 1,
      matchedHasL2p: false,
    });
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: jest.fn(),

        calibrate: { accessToken: "tok", groundTruthPersonId: null },
        deps: { matchFaceFn: v_a97841, calibrateFn: v_7db14d },
      }),
    );

    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_7db14d).toHaveBeenCalledTimes(1));
    expect(v_7db14d).toHaveBeenCalledWith("tok", v_87d4f2, null, 999);

    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_7db14d).toHaveBeenCalledTimes(2));
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_7db14d).toHaveBeenCalledTimes(3));
  });

  it("계측은 onDiag 소비자가 없어도(HUD 미표시) 전송된다 — 진단 블록과 분리", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: null,
      threshold: 0.83,
    });
    const v_7db14d = jest.fn().mockResolvedValue({
      id: 2,
      matchedId: null,
      bestScore: 0.1,
      threshold: 0.83,
      scoreCount: 0,
      matchedHasL2p: null,
    });
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({
        enabled: true,
        accessToken: "tok",
        cloneId: 12,
        onEvent: jest.fn(),

        calibrate: { accessToken: "tok", groundTruthPersonId: null },
        deps: { matchFaceFn: v_a97841, calibrateFn: v_7db14d },
      }),
    );
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_7db14d).toHaveBeenCalledTimes(1));
    expect(v_7db14d).toHaveBeenCalledWith("tok", v_87d4f2, null, 12);
  });

  it("게이트 off(calibrate 미지정) → calibrateFn 미호출", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 9, displayName: "지수", score: 0.81 },
      threshold: 0.83,
    });
    const v_7db14d = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: jest.fn(),
        deps: { matchFaceFn: v_a97841, calibrateFn: v_7db14d },
      }),
    );
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(1));
    expect(v_7db14d).not.toHaveBeenCalled();
  });

  it("계측 전송이 실패해도(rejected) 인식 루프는 계속 돈다 — fire-and-forget", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 4, displayName: "민수", score: 0.9 },
      threshold: 0.5,
    });

    const v_7db14d = jest.fn().mockRejectedValue(new Error("400 invalid cloneId"));
    const v_68885c = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: v_68885c,
        calibrate: { accessToken: "tok", groundTruthPersonId: null },
        deps: { matchFaceFn: v_a97841, calibrateFn: v_7db14d },
      }),
    );

    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_7db14d).toHaveBeenCalledTimes(1));
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_7db14d).toHaveBeenCalledTimes(2));
    v_43c42e.current.onEmbedding(v_87d4f2);

    await v_81e49f(() => expect(v_68885c).toHaveBeenCalledTimes(1));
    expect(v_68885c).toHaveBeenCalledWith({ type: "speaker_confirmed", personId: 4, displayName: "민수" });
  });

  it("네트워크 실패 사이클(cycle 없음)에는 계측을 보내지 않는다 — 백오프 무력화 방지", async () => {
    const v_a97841 = jest.fn().mockRejectedValue(new Error("network"));
    const v_7db14d = jest.fn();
    const { result: v_43c42e } = v_0da18b(() =>
      v_e9685b({
        enabled: true,
        accessToken: "tok",
        cloneId: 999,
        onEvent: jest.fn(),
        calibrate: { accessToken: "tok", groundTruthPersonId: null },
        deps: { matchFaceFn: v_a97841, calibrateFn: v_7db14d },
      }),
    );
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(1));
    expect(v_7db14d).not.toHaveBeenCalled();
  });
});
