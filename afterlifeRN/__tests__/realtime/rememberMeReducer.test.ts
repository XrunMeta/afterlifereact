import {
  ENROLL_GRACE_MS,
  initRememberMeState,
  rememberMeReducer,
  type RememberMeState,
} from "../../src/realtime/rememberMeReducer";

const step = (
  s: RememberMeState,
  e: Parameters<typeof rememberMeReducer>[1],
  nowMs = 0,
) => rememberMeReducer(s, e, nowMs);

describe("rememberMeReducer", () => {
  it("초기 상태는 확인됨 + 시트 닫힘", () => {
    const s = initRememberMeState();
    expect(s.identified).toBe(true);
    expect(s.sheetOpen).toBe(false);
  });

  it("미등록 얼굴 → 미확정 + 시트 열림 + 대화 정지", () => {
    const { state, actions } = step(initRememberMeState(), { type: "UNKNOWN_FACE" });
    expect(state.identified).toBe(false);
    expect(state.sheetOpen).toBe(true);
    expect(actions).toEqual([{ type: "HALT_CONVERSATION" }]);
  });

  it("닫기 → 대화 재개, 그러나 미확정은 유지된다", () => {
    const a = step(initRememberMeState(), { type: "UNKNOWN_FACE" }).state;
    const { state, actions } = step(a, { type: "DISMISS" });
    expect(state.sheetOpen).toBe(false);
    expect(state.identified).toBe(false); 
    expect(actions).toEqual([{ type: "RESUME_CONVERSATION" }]);
  });

  it("닫은 뒤 같은 얼굴이 계속 잡혀도 시트를 다시 강제로 열지 않는다", () => {
    let s = step(initRememberMeState(), { type: "UNKNOWN_FACE" }).state;
    s = step(s, { type: "DISMISS" }).state;

    for (let i = 0; i < 5; i++) {
      const r = step(s, { type: "UNKNOWN_FACE" });
      expect(r.state.sheetOpen).toBe(false);
      expect(r.actions).toEqual([]);
      s = r.state;
    }
    expect(s.identified).toBe(false); 
  });

  it("버튼 탭/서버 요청으로는 다시 열 수 있다", () => {
    let s = step(initRememberMeState(), { type: "UNKNOWN_FACE" }).state;
    s = step(s, { type: "DISMISS" }).state;
    const { state, actions } = step(s, { type: "OPEN_SHEET" });
    expect(state.sheetOpen).toBe(true);
    expect(actions).toEqual([{ type: "HALT_CONVERSATION" }]);
  });

  it("등록 완료 → 확인됨 + 시트 닫힘 + 대화 재개", () => {
    const a = step(initRememberMeState(), { type: "UNKNOWN_FACE" }).state;
    const { state, actions } = step(a, { type: "ENROLLED" });
    expect(state.identified).toBe(true);
    expect(state.sheetOpen).toBe(false);
    expect(actions).toEqual([{ type: "RESUME_CONVERSATION" }]);
  });

  it("이름 있는 얼굴이 인식되면 해제된다 — 유일한 자동 해제 경로", () => {
    let s = step(initRememberMeState(), { type: "UNKNOWN_FACE" }).state;
    s = step(s, { type: "DISMISS" }).state;
    expect(s.identified).toBe(false);

    const { state, actions } = step(s, { type: "KNOWN_FACE", named: true });
    expect(state.identified).toBe(true);
    expect(state.sheetOpen).toBe(false);

    expect(actions).toEqual([]);
  });

  it("이름 없는 person 이 매칭되면 해제하지 않는다 — 교착 방지", () => {

    const { state, actions } = step(initRememberMeState(), {
      type: "KNOWN_FACE",
      named: false,
    });
    expect(state.identified).toBe(false);
    expect(state.sheetOpen).toBe(true);
    expect(actions).toEqual([{ type: "HALT_CONVERSATION" }]);
  });

  it("이름 없는 매칭도 닫은 뒤에는 시트를 다시 강제로 열지 않는다", () => {
    let s = step(initRememberMeState(), { type: "KNOWN_FACE", named: false }).state;
    s = step(s, { type: "DISMISS" }).state;
    const r = step(s, { type: "KNOWN_FACE", named: false });
    expect(r.state.sheetOpen).toBe(false);
    expect(r.actions).toEqual([]);
  });

  it("대화 정지/재개는 시트 열림이 실제로 바뀔 때만 낸다", () => {
    let s = step(initRememberMeState(), { type: "UNKNOWN_FACE" }).state;

    const again = step(s, { type: "OPEN_SHEET" });
    expect(again.actions).toEqual([]);
    s = again.state;

    s = step(s, { type: "DISMISS" }).state;

    expect(step(s, { type: "DISMISS" }).actions).toEqual([]);
  });

  it("확인된 상태에서 말로 요청하면(OPEN_SHEET) 열리지만 미확정으로 떨어뜨리지는 않는다", () => {

    const { state } = step(initRememberMeState(), { type: "OPEN_SHEET" });
    expect(state.sheetOpen).toBe(true);
    expect(state.identified).toBe(true);
  });

  it("순수 함수 — 입력 상태를 변형하지 않는다", () => {
    const s0 = initRememberMeState();
    const snapshot = JSON.stringify(s0);
    step(s0, { type: "UNKNOWN_FACE" });
    expect(JSON.stringify(s0)).toBe(snapshot);
  });

  describe("등록 직후 유예", () => {
    it("등록 직후의 unknown 은 시트를 다시 열지 않는다", () => {
      const s = step(initRememberMeState(), { type: "ENROLLED" }, 1000).state;
      const { state, actions } = step(s, { type: "UNKNOWN_FACE" }, 1000 + 30_000);
      expect(state.identified).toBe(true);
      expect(state.sheetOpen).toBe(false);

      expect(actions).toEqual([]);
    });

    it("유예가 지나면 다시 미확정으로 떨어진다 — 등록이 끝내 반영 안 될 때의 탈출구", () => {
      const s = step(initRememberMeState(), { type: "ENROLLED" }, 1000).state;
      const { state } = step(s, { type: "UNKNOWN_FACE" }, 1000 + ENROLL_GRACE_MS + 1);
      expect(state.identified).toBe(false);
      expect(state.sheetOpen).toBe(true);
    });

    it("매칭이 돌아오면 유예는 즉시 끝난다 — 이후 진짜 새 얼굴은 정상 처리", () => {
      let s = step(initRememberMeState(), { type: "ENROLLED" }, 1000).state;
      s = step(s, { type: "KNOWN_FACE", named: true }, 1000 + 5_000).state;
      expect(s.graceUntilMs).toBeNull();

      const { state } = step(s, { type: "UNKNOWN_FACE" }, 1000 + 6_000);
      expect(state.identified).toBe(false);
      expect(state.sheetOpen).toBe(true);
    });

    it("유예 중 이름 없는 매칭도 시트를 열지 않는다 — UNKNOWN_FACE 위임 경로", () => {
      const s = step(initRememberMeState(), { type: "ENROLLED" }, 1000).state;
      const { state } = step(s, { type: "KNOWN_FACE", named: false }, 1000 + 10_000);
      expect(state.sheetOpen).toBe(false);
    });

    it("유예는 등록으로만 생긴다 — 통화 시작 직후의 unknown 은 그대로 시트를 연다", () => {
      const { state } = step(initRememberMeState(), { type: "UNKNOWN_FACE" }, 500);
      expect(state.identified).toBe(false);
      expect(state.sheetOpen).toBe(true);
    });
  });
});
