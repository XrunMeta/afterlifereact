import { v_0da18b, v_81e49f } from "dtbzepbezvovgqcnbkbssjenbxhgn";
import {
  v_f644ce,
  v_e9685b,
  v_48b3dc,
  v_65c90d,
  v_dd916a,
  type v_90fd14,
} from "../../src/face/useFaceIdentify";

const v_87d4f2 = new Array(512).fill(0).map((v_37eab7, v_ebec57) => (v_ebec57 === 0 ? 1 : 0));

describe("runIdentifyCycle (순수 로직)", () => {
  it("matchFace 가 동일 personId 3회 반환 → 3번째에 speaker_confirmed 1회", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({
      matches: [],
      best: { personId: 3, displayName: "철수", score: 0.9 },
      threshold: 0.5,
    });
    let s: v_90fd14 = v_48b3dc;

    let v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 1000, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.event).toBeNull();
    v_fd5f43 = v_cb35cb.state;

    v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 2000, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.event).toBeNull();
    v_fd5f43 = v_cb35cb.state;

    v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 3000, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 3, displayName: "철수" });

    expect(v_a97841).toHaveBeenCalledTimes(3);
  });

  it("best 가 null(미매치) 3회 → unknown_face 1회", async () => {
    const v_a97841 = jest.fn().mockResolvedValue({ matches: [], best: null, threshold: 0.5 });
    let s: v_90fd14 = v_48b3dc;
    let v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 1000, { matchFaceFn: v_a97841 });
    v_fd5f43 = v_cb35cb.state;
    v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 2000, { matchFaceFn: v_a97841 });
    v_fd5f43 = v_cb35cb.state;
    v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 3000, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
  });

  it("matchFace 실패(네트워크) → 사이클 스킵, event null, 크래시 없음", async () => {
    const v_a97841 = jest.fn().mockRejectedValue(new Error("network"));
    const s: v_90fd14 = v_48b3dc;
    const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", 1000, { matchFaceFn: v_a97841 });
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
      const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", v_5c2f9f, { matchFaceFn: v_a97841 });
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.consecutiveFailures).toBe(v_65c90d);
    expect(v_fd5f43.backoffUntilMs).toBe(v_5c2f9f + v_dd916a);

    const v_d928af = v_a97841.mock.calls.length;
    const v_b96973 = await v_f644ce(v_fd5f43, v_87d4f2, "tok", v_5c2f9f + 1, { matchFaceFn: v_a97841 });
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
      const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", v_5c2f9f, { matchFaceFn: v_a97841 });
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.backoffUntilMs).toBeGreaterThan(v_5c2f9f);

    v_5c2f9f = v_fd5f43.backoffUntilMs + 1; 
    const v_cb35cb = await v_f644ce(v_fd5f43, v_87d4f2, "tok", v_5c2f9f, { matchFaceFn: v_a97841 });
    expect(v_cb35cb.state.consecutiveFailures).toBe(0);
    expect(v_cb35cb.state.backoffUntilMs).toBe(0);
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
      v_e9685b({ enabled: false, accessToken: "tok", onEvent: jest.fn(), deps: { matchFaceFn: v_a97841 } }),
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
        v_e9685b({ enabled: v_d20c84, accessToken: "tok", onEvent: v_68885c, deps: { matchFaceFn: v_a97841 } }),
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
      v_e9685b({ enabled: true, accessToken: "tok", onEvent: jest.fn(), deps: { matchFaceFn: v_a97841 } }),
    );
    v_43c42e.current.onEmbedding(v_87d4f2);
    await v_81e49f(() => expect(v_a97841).toHaveBeenCalledTimes(1));
    expect(v_43c42e.current.getBuffer().latest(1)).toHaveLength(1);
  });
});
