import {
  initRememberMeState,
  rememberMeReducer,
  type RememberMeState,
} from "../../src/realtime/rememberMeReducer";

const step = (s: RememberMeState, e: Parameters<typeof rememberMeReducer>[1]) =>
  rememberMeReducer(s, e);

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

  it("등록된 얼굴이 인식되면 해제된다 — 유일한 자동 해제 경로", () => {
    let s = step(initRememberMeState(), { type: "UNKNOWN_FACE" }).state;
    s = step(s, { type: "DISMISS" }).state;
    expect(s.identified).toBe(false);

    const { state, actions } = step(s, { type: "KNOWN_FACE" });
    expect(state.identified).toBe(true);
    expect(state.sheetOpen).toBe(false);

    expect(actions).toEqual([]);
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
});
