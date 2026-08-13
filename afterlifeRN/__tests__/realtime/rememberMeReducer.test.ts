import {
  v_a5c955,
  v_a793e1,
  v_df0f57,
  v_178dfb,
  v_706a74,
  v_b94941,
  v_f8761c,
  v_059bf8,
  type v_8118fb,
} from "../../src/realtime/rememberMeReducer";

const v_729796 = (
  s: v_8118fb,
  e: Parameters<typeof v_706a74>[1],
  v_67e77e = 0,
) => v_706a74(v_fd5f43, v_9e86fd, v_67e77e);

const v_d81543 = (
  v_ca1ec5,
  v_328259 = {},
) =>
  ({
    type: "MATCH_KNOWN",
    personId: v_ca1ec5,
    displayName: v_328259.name ?? "도기",
    named: v_328259.named ?? true,
    cloneSpeaking: v_328259.cloneSpeaking ?? false,
  }) as const;

const v_30b0d4 = (v_67e77e = 0) =>
  v_729796(v_178dfb(), v_d81543(58), v_67e77e).state;

describe("rememberMeReducer — 확정", () => {
  it("초기 상태는 확인됨 + 시트 닫힘", () => {
    const v_fd5f43 = v_178dfb();
    expect(v_fd5f43.mode).toBe("identified");
    expect(v_fd5f43.sheetOpen).toBe(false);
    expect(v_f8761c(v_fd5f43)).toBe(false);
  });

  it("등록된 얼굴은 **1회 매칭으로 즉시** 확정된다", () => {

    const { state: v_b6e533 } = v_729796(v_178dfb(), v_d81543(58));
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(58);
  });

  it("이름 없는 매칭은 확정이 아니다 — unknown 과 동일 취급(교착 방지)", () => {

    const { state: v_b6e533 } = v_729796(v_178dfb(), v_d81543(45, { named: false }));
    expect(v_b6e533.mode).toBe("pending");
    expect(v_f8761c(v_b6e533)).toBe(true);
  });
});

describe("rememberMeReducer — grace(6턴)", () => {
  it("확정자를 놓쳐도 즉시 대기로 가지 않는다 — 대화는 계속된다", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" });
    expect(v_b6e533.mode).toBe("grace");
    expect(v_b6e533.graceTurns).toBe(v_df0f57);
    expect(v_b6e533.personId).toBe(58); 

    expect(v_dd943a).toEqual([]);
    expect(v_f8761c(v_b6e533)).toBe(false);
  });

  it("unknown 이 반복돼도 카운터가 리셋되지 않는다", () => {

    let v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "TURN_END" }, 1000).state;
    expect(v_fd5f43.graceTurns).toBe(v_df0f57 - 1);
    v_fd5f43 = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 2000).state;
    expect(v_fd5f43.graceTurns).toBe(v_df0f57 - 1); 
  });

  it("6턴을 소진하면 대기로 전환하고 마이크를 닫는다", () => {
    let v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }).state;
    let actions: ReturnType<typeof v_729796>["actions"] = [];
    for (let v_ebec57 = 0; v_ebec57 < v_df0f57; v_ebec57++) {
      const v_cb35cb = v_729796(v_fd5f43, { type: "TURN_END" }, 1000 * (v_ebec57 + 1));
      v_fd5f43 = v_cb35cb.state;
      v_dd943a = v_cb35cb.actions;
    }
    expect(v_fd5f43.mode).toBe("pending");
    expect(v_fd5f43.sheetOpen).toBe(true);
    expect(v_dd943a).toEqual([{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }]);
  });

  it("붙들고 있던 사람이 돌아오면 카운터가 사라진다 — 인사는 하지 않는다", () => {

    const v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }).state;
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_fd5f43, v_d81543(58));
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.graceTurns).toBe(0);
    expect(v_dd943a).toEqual([]);
  });

  it("확정된 적이 없는 통화의 unknown 은 grace 를 거치지 않고 바로 대기로 간다", () => {

    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN" });
    expect(v_b6e533.mode).toBe("pending");
    expect(v_dd943a).toEqual([{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }]);
  });

  it("30초간 턴이 흐르지 않으면 통화를 끊는다", () => {

    const v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;
    expect(v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_a793e1 - 1).actions).toEqual([]);
    expect(v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_a793e1).actions).toEqual([
      { type: "END_CALL" },
    ]);
  });

  it("턴이 흐르면 무턴 타이머가 갱신된다", () => {
    let v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "TURN_END" }, 20_000).state;

    expect(v_729796(v_fd5f43, { type: "TICK" }, 40_000).actions).toEqual([]);
    expect(v_729796(v_fd5f43, { type: "TICK" }, 50_000).actions).toEqual([{ type: "END_CALL" }]);
  });

  it("ACTIVITY 는 턴을 소모하지 않고 무턴 타이머만 미룬다", () => {

    let v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "ACTIVITY" }, 20_000);
    expect(v_cb35cb.state.graceTurns).toBe(v_df0f57); 
    expect(v_cb35cb.actions).toEqual([]);
    v_fd5f43 = v_cb35cb.state;

    expect(v_729796(v_fd5f43, { type: "TICK" }, 45_000).actions).toEqual([]);
    expect(v_729796(v_fd5f43, { type: "TICK" }, 50_000).actions).toEqual([{ type: "END_CALL" }]);
  });

  it("grace 가 아니면 ACTIVITY 는 아무것도 하지 않는다", () => {
    const v_e98932 = v_30b0d4();
    expect(v_729796(v_e98932, { type: "ACTIVITY" }, 5000).state).toEqual(v_e98932);
  });

  it("grace 가 아니면 TICK 은 아무것도 하지 않는다", () => {
    expect(v_729796(v_30b0d4(), { type: "TICK" }, 10_000_000).actions).toEqual([]);
    const v_e2a85c = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN" }).state;
    expect(v_729796(v_e2a85c, { type: "TICK" }, 10_000_000).actions).toEqual([]);
  });
});

describe("rememberMeReducer — 다른 사람 등장", () => {
  it("등록된 다른 사람이 오면 즉시 그 사람으로 갈아타고 인사한다", () => {

    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_30b0d4(), v_d81543(70, { name: "미미" }));
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(70);
    expect(v_dd943a).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 70, displayName: "미미", rejoin: true },
    ]);
  });

  it("클론이 말하는 중이면 전환을 미룬다 — 하던 말을 끊지 않는다", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(
      v_30b0d4(),
      v_d81543(70, { name: "미미", cloneSpeaking: true }),
    );
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(58); 
    expect(v_b6e533.pendingSwitch).toEqual({ personId: 70, displayName: "미미" });
    expect(v_dd943a).toEqual([]);
  });

  it("클론 발화가 끝나면 미뤄 둔 전환이 실행된다", () => {
    const v_fd5f43 = v_729796(v_30b0d4(), v_d81543(70, { name: "미미", cloneSpeaking: true })).state;
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_fd5f43, { type: "CLONE_SPEECH_END" });
    expect(v_b6e533.personId).toBe(70);
    expect(v_b6e533.pendingSwitch).toBeNull();
    expect(v_dd943a).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 70, displayName: "미미", rejoin: true },
    ]);
  });

  it("미뤄 둔 전환이 없으면 발화 종료는 아무것도 하지 않는다", () => {
    const v_cb35cb = v_729796(v_30b0d4(), { type: "CLONE_SPEECH_END" });
    expect(v_cb35cb.actions).toEqual([]);
    expect(v_cb35cb.state.personId).toBe(58);
  });
});

describe("rememberMeReducer — 대기(pending)", () => {
  const v_483de2 = () => v_729796(v_178dfb(), { type: "MATCH_UNKNOWN" }).state;

  it("대기 중에는 버튼이 뜨고 마이크가 닫혀 있다", () => {
    const v_fd5f43 = v_483de2();
    expect(v_f8761c(v_fd5f43)).toBe(true);
    expect(v_b94941(v_fd5f43)).toBe(true);
  });

  it("🔴 시트를 닫아도 대기는 유지된다 — 마이크를 열지 않는다", () => {

    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_483de2(), { type: "DISMISS" });
    expect(v_b6e533.mode).toBe("pending");
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_f8761c(v_b6e533)).toBe(true);
    expect(v_b94941(v_b6e533)).toBe(true);
    expect(v_dd943a).toEqual([]); 
  });

  it("닫은 뒤 얼굴이 계속 잡혀도 시트를 다시 강제로 열지 않는다", () => {
    let v_fd5f43 = v_729796(v_483de2(), { type: "DISMISS" }).state;
    for (let v_ebec57 = 0; v_ebec57 < 5; v_ebec57++) {
      const v_cb35cb = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, v_ebec57 * 3000);
      expect(v_cb35cb.state.sheetOpen).toBe(false);
      expect(v_cb35cb.actions).toEqual([]);
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.mode).toBe("pending");
  });

  it("대기가 길어지면 서버에 주기적으로 다시 알린다", () => {

    const v_fd5f43 = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN" }, 1000).state;
    expect(v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1000 + 30_000).actions).toEqual([]);
    const v_cb35cb = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1000 + v_059bf8);
    expect(v_cb35cb.actions).toEqual([{ type: "NOTIFY_UNKNOWN" }]);

    expect(
      v_729796(v_cb35cb.state, { type: "MATCH_UNKNOWN" }, 1000 + v_059bf8 + 3000).actions,
    ).toEqual([]);
  });

  it("버튼 탭으로는 다시 열 수 있다", () => {
    const v_fd5f43 = v_729796(v_483de2(), { type: "DISMISS" }).state;
    const { state: v_b6e533 } = v_729796(v_fd5f43, { type: "OPEN_SHEET" });
    expect(v_b6e533.sheetOpen).toBe(true);
  });

  it("아는 얼굴이 돌아오면 대기가 풀리고 재인사한다 — 유일한 자동 해제 경로", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_483de2(), v_d81543(58));
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(58);
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_dd943a).toEqual([
      { type: "MIC_ON" },
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: true },
    ]);
  });

  it("등록을 마치면 대기가 풀리고 마이크가 열린다", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_483de2(), { type: "ENROLLED" }, 1000);
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_dd943a).toEqual([{ type: "MIC_ON" }]);
  });
});

describe("rememberMeReducer — 시트와 마이크", () => {
  it("확정된 사람이 이름을 고치려 열면 신원은 흔들리지 않되 마이크는 닫힌다", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_30b0d4(), { type: "OPEN_SHEET" });
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.sheetOpen).toBe(true);
    expect(v_dd943a).toEqual([{ type: "MIC_OFF" }]);
    expect(v_b94941(v_b6e533)).toBe(true);
  });

  it("확정 상태에서 닫으면 마이크가 돌아온다", () => {
    const v_fd5f43 = v_729796(v_30b0d4(), { type: "OPEN_SHEET" }).state;
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_fd5f43, { type: "DISMISS" });
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_dd943a).toEqual([{ type: "MIC_ON" }]);
  });

  it("마이크 신호는 실제로 바뀔 때만 낸다", () => {

    const v_fd5f43 = v_729796(v_30b0d4(), { type: "OPEN_SHEET" }).state;
    expect(v_729796(v_fd5f43, { type: "OPEN_SHEET" }).actions).toEqual([]);
    const v_3f4e2e = v_729796(v_fd5f43, { type: "DISMISS" }).state;
    expect(v_729796(v_3f4e2e, { type: "DISMISS" }).actions).toEqual([]);
  });
});

describe("rememberMeReducer — 등록 직후 유예", () => {

  it("등록 직후의 unknown 은 대기로 보내지 않는다", () => {
    const v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED" }, 1000).state;
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1000 + 30_000);
    expect(v_b6e533.mode).toBe("identified");
    expect(v_dd943a).toEqual([]);
  });

  it("유예가 지나면 다시 대기로 떨어진다 — 등록이 끝내 반영 안 될 때의 탈출구", () => {
    const v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED" }, 1000).state;
    const { state: v_b6e533 } = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1000 + v_a5c955 + 1);
    expect(v_b6e533.mode).toBe("pending");
  });

  it("매칭이 돌아오면 유예는 즉시 끝난다", () => {
    let v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED" }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, v_d81543(58), 6000).state;
    expect(v_fd5f43.enrollGraceUntilMs).toBeNull();

    const { state: v_b6e533 } = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 7000);
    expect(v_b6e533.mode).toBe("grace");
  });

  it("유예 중 이름 없는 매칭도 대기로 보내지 않는다 — unknown 위임 경로", () => {
    const v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED" }, 1000).state;
    const { state: v_b6e533 } = v_729796(v_fd5f43, v_d81543(45, { named: false }), 11_000);
    expect(v_b6e533.mode).toBe("identified");
  });
});

describe("rememberMeReducer — 순수성", () => {
  it("입력 상태를 변형하지 않는다", () => {
    const v_ca01e0 = v_30b0d4();
    const v_5392c4 = JSON.stringify(v_ca01e0);
    v_729796(v_ca01e0, { type: "MATCH_UNKNOWN" });
    v_729796(v_ca01e0, { type: "TURN_END" });
    v_729796(v_ca01e0, v_d81543(70));
    expect(JSON.stringify(v_ca01e0)).toBe(v_5392c4);
  });
});
