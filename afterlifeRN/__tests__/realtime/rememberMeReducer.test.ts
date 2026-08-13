import {
  v_178dfb,
  v_706a74,
  type v_8118fb,
} from "../../src/realtime/rememberMeReducer";

const v_729796 = (s: v_8118fb, e: Parameters<typeof v_706a74>[1]) =>
  v_706a74(v_fd5f43, v_9e86fd);

describe("rememberMeReducer", () => {
  it("초기 상태는 확인됨 + 시트 닫힘", () => {
    const v_fd5f43 = v_178dfb();
    expect(v_fd5f43.identified).toBe(true);
    expect(v_fd5f43.sheetOpen).toBe(false);
  });

  it("미등록 얼굴 → 미확정 + 시트 열림 + 대화 정지", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_178dfb(), { type: "UNKNOWN_FACE" });
    expect(v_b6e533.identified).toBe(false);
    expect(v_b6e533.sheetOpen).toBe(true);
    expect(v_dd943a).toEqual([{ type: "HALT_CONVERSATION" }]);
  });

  it("닫기 → 대화 재개, 그러나 미확정은 유지된다", () => {
    const v_779914 = v_729796(v_178dfb(), { type: "UNKNOWN_FACE" }).state;
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_779914, { type: "DISMISS" });
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_b6e533.identified).toBe(false); 
    expect(v_dd943a).toEqual([{ type: "RESUME_CONVERSATION" }]);
  });

  it("닫은 뒤 같은 얼굴이 계속 잡혀도 시트를 다시 강제로 열지 않는다", () => {
    let v_fd5f43 = v_729796(v_178dfb(), { type: "UNKNOWN_FACE" }).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "DISMISS" }).state;

    for (let v_ebec57 = 0; v_ebec57 < 5; v_ebec57++) {
      const v_cb35cb = v_729796(v_fd5f43, { type: "UNKNOWN_FACE" });
      expect(v_cb35cb.state.sheetOpen).toBe(false);
      expect(v_cb35cb.actions).toEqual([]);
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.identified).toBe(false); 
  });

  it("버튼 탭/서버 요청으로는 다시 열 수 있다", () => {
    let v_fd5f43 = v_729796(v_178dfb(), { type: "UNKNOWN_FACE" }).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "DISMISS" }).state;
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_fd5f43, { type: "OPEN_SHEET" });
    expect(v_b6e533.sheetOpen).toBe(true);
    expect(v_dd943a).toEqual([{ type: "HALT_CONVERSATION" }]);
  });

  it("등록 완료 → 확인됨 + 시트 닫힘 + 대화 재개", () => {
    const v_779914 = v_729796(v_178dfb(), { type: "UNKNOWN_FACE" }).state;
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_779914, { type: "ENROLLED" });
    expect(v_b6e533.identified).toBe(true);
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_dd943a).toEqual([{ type: "RESUME_CONVERSATION" }]);
  });

  it("이름 있는 얼굴이 인식되면 해제된다 — 유일한 자동 해제 경로", () => {
    let v_fd5f43 = v_729796(v_178dfb(), { type: "UNKNOWN_FACE" }).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "DISMISS" }).state;
    expect(v_fd5f43.identified).toBe(false);

    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_fd5f43, { type: "KNOWN_FACE", named: true });
    expect(v_b6e533.identified).toBe(true);
    expect(v_b6e533.sheetOpen).toBe(false);

    expect(v_dd943a).toEqual([]);
  });

  it("이름 없는 person 이 매칭되면 해제하지 않는다 — 교착 방지", () => {

    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_178dfb(), {
      type: "KNOWN_FACE",
      named: false,
    });
    expect(v_b6e533.identified).toBe(false);
    expect(v_b6e533.sheetOpen).toBe(true);
    expect(v_dd943a).toEqual([{ type: "HALT_CONVERSATION" }]);
  });

  it("이름 없는 매칭도 닫은 뒤에는 시트를 다시 강제로 열지 않는다", () => {
    let v_fd5f43 = v_729796(v_178dfb(), { type: "KNOWN_FACE", named: false }).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "DISMISS" }).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "KNOWN_FACE", named: false });
    expect(v_cb35cb.state.sheetOpen).toBe(false);
    expect(v_cb35cb.actions).toEqual([]);
  });

  it("대화 정지/재개는 시트 열림이 실제로 바뀔 때만 낸다", () => {
    let v_fd5f43 = v_729796(v_178dfb(), { type: "UNKNOWN_FACE" }).state;

    const v_826279 = v_729796(v_fd5f43, { type: "OPEN_SHEET" });
    expect(v_826279.actions).toEqual([]);
    v_fd5f43 = v_826279.state;

    v_fd5f43 = v_729796(v_fd5f43, { type: "DISMISS" }).state;

    expect(v_729796(v_fd5f43, { type: "DISMISS" }).actions).toEqual([]);
  });

  it("확인된 상태에서 말로 요청하면(OPEN_SHEET) 열리지만 미확정으로 떨어뜨리지는 않는다", () => {

    const { state: v_b6e533 } = v_729796(v_178dfb(), { type: "OPEN_SHEET" });
    expect(v_b6e533.sheetOpen).toBe(true);
    expect(v_b6e533.identified).toBe(true);
  });

  it("순수 함수 — 입력 상태를 변형하지 않는다", () => {
    const v_ca01e0 = v_178dfb();
    const v_5392c4 = JSON.stringify(v_ca01e0);
    v_729796(v_ca01e0, { type: "UNKNOWN_FACE" });
    expect(JSON.stringify(v_ca01e0)).toBe(v_5392c4);
  });
});
