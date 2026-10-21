import {
  v_a5c955,
  v_575cf8,
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

    let v_fd5f43 = v_729796(v_178dfb(), v_d81543(45, { named: false })).state;
    v_fd5f43 = v_729796(v_fd5f43, v_d81543(45, { named: false }), 500).state;
    expect(v_fd5f43.mode).toBe("pending");
    expect(v_f8761c(v_fd5f43)).toBe(true);
  });
});

describe("rememberMeReducer — grace(30초 유지)", () => {
  it("확정자를 놓쳐도 즉시 대기로 가지 않는다 — 대화는 계속된다", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000);
    expect(v_b6e533.mode).toBe("grace");
    expect(v_b6e533.graceSinceMs).toBe(1000);
    expect(v_b6e533.personId).toBe(58); 

    expect(v_dd943a).toEqual([]);
    expect(v_f8761c(v_b6e533)).toBe(false);
  });

  it("unknown 이 반복돼도 유지 기준점이 리셋되지 않는다 (streak escalation 전까지)", () => {

    const v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;

    expect(v_fd5f43.mode).toBe("grace");
    expect(v_fd5f43.graceSinceMs).toBe(1000);
  });

  it("30초까지는 그 사람으로 유지한다", () => {
    const v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_575cf8 - 1);
    expect(v_cb35cb.state.mode).toBe("grace");
    expect(v_cb35cb.actions).toEqual([]);
  });

  it("30초가 지나고 그 사이 대화가 있었으면 대기로 간다", () => {

    let v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "ACTIVITY" }, 5000).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_575cf8);
    expect(v_cb35cb.state.mode).toBe("pending");
    expect(v_cb35cb.state.sheetOpen).toBe(false);
    expect(v_cb35cb.actions).toEqual([{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }]);
  });

  it("30초가 지나도록 아무 말도 없었으면 통화를 끊는다", () => {

    const v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_575cf8);
    expect(v_cb35cb.actions).toEqual([{ type: "END_CALL" }]);
  });

  it("🔴 붙들고 있던 사람이 돌아오면 인사하지 않고 이름만 부르게 한다", () => {

    const v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_fd5f43, v_d81543(58), 5000);
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.graceSinceMs).toBeNull();
    expect(v_dd943a).toEqual([
      {
        type: "NOTIFY_CONFIRMED",
        personId: 58,
        displayName: "도기",
        rejoin: false, 
        mentionName: true,
      },
    ]);
  });

  it("확정된 적이 없는 통화의 unknown 은 grace 를 거치지 않고 바로 대기로 간다 (streak 2 도달 시)", () => {

    let v_fd5f43 = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN" }).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 500);
    expect(v_cb35cb.state.mode).toBe("pending");
    expect(v_cb35cb.actions).toEqual([{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }]);
  });

  it("ACTIVITY 는 유지 시간을 연장하지 않는다 — 갈 곳만 바꾼다", () => {

    let v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN" }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "ACTIVITY" }, 25_000).state;
    expect(v_fd5f43.graceSinceMs).toBe(1000); 
    expect(v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_575cf8).state.mode).toBe("pending");
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

  it("클론이 말하는 중이어도 즉시 컷인 + INTERRUPT_TTS (T-532B 정책 변경)", () => {

    const { state: v_b6e533, actions: v_dd943a } = v_729796(
      v_30b0d4(),
      v_d81543(70, { name: "미미", cloneSpeaking: true }),
    );
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(70); 
    expect(v_b6e533.pendingSwitch).toBeNull();
    expect(v_dd943a).toEqual([
      { type: "INTERRUPT_TTS" },
      { type: "NOTIFY_CONFIRMED", personId: 70, displayName: "미미", rejoin: true },
    ]);
  });

  it("cloneSpeaking=false 도 즉시 전환 (INTERRUPT_TTS 는 안 냄)", () => {

    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_30b0d4(), v_d81543(70, { name: "미미" }));
    expect(v_b6e533.personId).toBe(70);
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

  const v_483de2 = () => {
    const v_3f6eae = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN", score: 0.3 }, 0).state;
    return v_729796(v_3f6eae, { type: "MATCH_UNKNOWN", score: 0.3 }, 500).state;
  };

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

    let v_fd5f43 = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN" }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1500).state; 
    expect(v_fd5f43.mode).toBe("pending");

    expect(v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1500 + 1000).actions).toEqual([]);

    const v_cb35cb = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1500 + v_059bf8);
    expect(v_cb35cb.actions).toEqual([{ type: "NOTIFY_UNKNOWN" }]);

    expect(
      v_729796(v_cb35cb.state, { type: "MATCH_UNKNOWN" }, 1500 + v_059bf8 + 3000).actions,
    ).toEqual([]);
  });

  it("버튼 탭으로는 다시 열 수 있다", () => {
    const v_fd5f43 = v_729796(v_483de2(), { type: "DISMISS" }).state;
    const { state: v_b6e533 } = v_729796(v_fd5f43, { type: "OPEN_SHEET" });
    expect(v_b6e533.sheetOpen).toBe(true);
  });

  it("아는 얼굴이 처음으로 잡히면 대기가 풀리고 조용히 확정 (재인사 X · T-561)", () => {

    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_483de2(), v_d81543(58));
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(58);
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_dd943a).toEqual([
      { type: "MIC_ON" },
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: false, mentionName: false },
    ]);
  });

  it("오래 전 (90초 초과) 봤던 사람이 pending 후 돌아오면 rejoin=true (다시 오셨네요)", () => {

    let v_fd5f43 = v_729796(v_178dfb(), v_d81543(58), 0).state; 
    v_fd5f43 = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 100_000).state; 
    v_fd5f43 = v_729796(v_fd5f43, { type: "ACTIVITY" }, 105_000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "TICK" }, 100_000 + v_575cf8).state; 

    const { actions: v_dd943a } = v_729796(v_fd5f43, v_d81543(58), 200_000);
    expect(v_dd943a).toEqual([
      { type: "MIC_ON" },
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: true, mentionName: false },
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
    let v_33efc5 = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1000 + v_a5c955 + 1).state;
    v_33efc5 = v_729796(v_33efc5, { type: "MATCH_UNKNOWN" }, 1000 + v_a5c955 + 100).state;
    expect(v_33efc5.mode).toBe("pending");
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
    v_729796(v_ca01e0, { type: "ACTIVITY" });
    v_729796(v_ca01e0, v_d81543(70));
    expect(JSON.stringify(v_ca01e0)).toBe(v_5392c4);
  });
});

describe("rememberMeReducer — T-559 프로액티브 sheet (score gate)", () => {

  const v_481bae = (v_740dd8) => {
    const v_9e6ec9 = v_740dd8 !== undefined
      ? ({ type: "MATCH_UNKNOWN" as const, score: v_740dd8 })
      : ({ type: "MATCH_UNKNOWN" as const });
    let v_fd5f43 = v_729796(v_178dfb(), v_9e6ec9, 1000).state;
    return v_729796(v_fd5f43, v_9e6ec9, 1500);
  };

  it("score 미제공 (undefined) — sheet 자동 open 안 함 (T-557 기본)", () => {
    const { state: v_b6e533 } = v_481bae(undefined);
    expect(v_b6e533.mode).toBe("pending");
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_f8761c(v_b6e533)).toBe(true);
  });

  it("score === 0 — sheet 자동 open 안 함 (DB 비어있음 · 완전 미확정 케이스)", () => {
    const { state: v_b6e533 } = v_481bae(0);
    expect(v_b6e533.mode).toBe("pending");
    expect(v_b6e533.sheetOpen).toBe(false);
  });

  it("score > 0 — 프로액티브 등록 팝업 (T-562: sheet 대신 promptRegister)", () => {

    const { state: v_b6e533 } = v_481bae(0.25);
    expect(v_b6e533.mode).toBe("pending");
    expect(v_b6e533.sheetOpen).toBe(false); 
    expect(v_b6e533.promptRegister).toBe(true); 
    expect(v_b94941(v_b6e533)).toBe(true);
  });

  it("T-562 · CONFIRM_PROMPT — 팝업만 닫고 대기 유지", () => {
    const v_fd5f43 = v_481bae(0.3).state;
    expect(v_fd5f43.promptRegister).toBe(true);
    const v_cb35cb = v_729796(v_fd5f43, { type: "CONFIRM_PROMPT" }, 2000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.mode).toBe("pending"); 
    expect(v_cb35cb.actions).toEqual([]); 
  });

  it("T-562 · DISMISS_PROMPT — 팝업만 닫고 대기 유지 (하위호환)", () => {
    const v_fd5f43 = v_481bae(0.3).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "DISMISS_PROMPT" }, 2000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.mode).toBe("pending");
    expect(v_cb35cb.actions).toEqual([]);
  });

  it("T-562 (B안) · CONFIRM_SAME_PERSON — lastConfirmedPerson 복원 + MIC_ON + dismiss 플래그", () => {

    let v_fd5f43 = v_729796(v_178dfb(), {
      type: "MATCH_KNOWN",
      personId: 58,
      named: true,
      displayName: "서지호",
      cloneSpeaking: false,
    }, 500).state;
    expect(v_fd5f43.lastConfirmedPerson).toEqual({ personId: 58, displayName: "서지호" });

    v_fd5f43 = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN", score: 0.3 }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "ACTIVITY" }, 5_000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "TICK" }, 2000 + v_575cf8).state;
    expect(v_fd5f43.mode).toBe("pending");
    expect(v_fd5f43.promptRegister).toBe(true);

    const v_cb35cb = v_729796(v_fd5f43, { type: "CONFIRM_SAME_PERSON" }, 10_000);
    expect(v_cb35cb.state.mode).toBe("identified");
    expect(v_cb35cb.state.personId).toBe(58);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.dismissedPromptInCall).toBe(true);
    expect(v_cb35cb.actions).toContainEqual({ type: "MIC_ON" });
  });

  it("T-562 (B안) · CONFIRM_SAME_PERSON — 복원할 person 없으면 DISMISS_LATER 처럼 처리", () => {

    let v_fd5f43 = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN", score: 0.3 }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN", score: 0.3 }, 1500).state;
    expect(v_fd5f43.lastConfirmedPerson).toBeNull();
    expect(v_fd5f43.promptRegister).toBe(true);
    const v_cb35cb = v_729796(v_fd5f43, { type: "CONFIRM_SAME_PERSON" }, 2000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.dismissedPromptInCall).toBe(true);
    expect(v_cb35cb.state.mode).toBe("identified");
    expect(v_cb35cb.state.personId).toBeNull();
    expect(v_cb35cb.actions).toContainEqual({ type: "MIC_ON" });
  });

  it("T-562 (B안) · DISMISS_LATER — pending 해제 + MIC_ON + 이번 통화 재출현 억제", () => {

    let v_fd5f43 = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN", score: 0.3 }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN", score: 0.3 }, 1500).state;
    expect(v_fd5f43.promptRegister).toBe(true);
    const v_cb35cb = v_729796(v_fd5f43, { type: "DISMISS_LATER" }, 2000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.dismissedPromptInCall).toBe(true);
    expect(v_cb35cb.state.mode).toBe("identified");
    expect(v_cb35cb.actions).toContainEqual({ type: "MIC_ON" });

    const v_826279 = v_729796(v_cb35cb.state, { type: "MATCH_UNKNOWN", score: 0.3 }, 60_000);
    expect(v_826279.state.promptRegister).toBe(false);
  });

  it("T-562 (B안) · ENROLLED 는 dismissedPromptInCall 을 리셋 (등록 완료 = 클린 슬레이트)", () => {

    let v_fd5f43 = v_729796(v_178dfb(), { type: "MATCH_UNKNOWN", score: 0.3 }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN", score: 0.3 }, 1500).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "DISMISS_LATER" }, 2000).state;
    expect(v_fd5f43.dismissedPromptInCall).toBe(true);
    const v_cb35cb = v_729796(v_fd5f43, { type: "ENROLLED" }, 3000);
    expect(v_cb35cb.state.dismissedPromptInCall).toBe(false);
  });

  it("score > 0 이라도 확정자가 있으면 grace 로 감 (sheet 자동 open X · 그 사람 유지)", () => {

    const { state: v_b6e533 } = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN", score: 0.3 }, 1000);
    expect(v_b6e533.mode).toBe("grace");
    expect(v_b6e533.sheetOpen).toBe(false);
  });

  it("grace 만료로 TICK → pending 진입 시엔 sheet 자동 open X (자리 뜬 케이스)", () => {

    let v_fd5f43 = v_729796(v_30b0d4(), { type: "MATCH_UNKNOWN", score: 0.3 }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "ACTIVITY" }, 5_000).state;
    const { state: v_b6e533 } = v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_575cf8);
    expect(v_b6e533.mode).toBe("pending");
    expect(v_b6e533.sheetOpen).toBe(false);
  });
});

describe("rememberMeReducer — multi_face 뒤 재확정", () => {
  it("multi_face 뒤 같은 사람이 잡히면 인사 없이 다시 알린다(1회)", () => {
    const v_3f6eae = v_729796(v_30b0d4(), { type: "MULTI_FACE_SENT" }).state;
    expect(v_3f6eae.serverSpeakerCleared).toBe(true);

    const v_cb35cb = v_729796(v_3f6eae, v_d81543(58), 1000);
    expect(v_cb35cb.actions).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: false },
    ]);
    expect(v_cb35cb.state.serverSpeakerCleared).toBe(false);

    expect(v_729796(v_cb35cb.state, v_d81543(58), 2000).actions).toEqual([]);
  });

  it("multi_face 가 없으면 같은 사람 매칭은 조용하다(기존 동작)", () => {
    expect(v_729796(v_30b0d4(), v_d81543(58), 1000).actions).toEqual([]);
  });

  it("확정된 사람이 없으면 multi_face 는 상태를 바꾸지 않는다", () => {
    const v_ca01e0 = v_178dfb();
    expect(v_729796(v_ca01e0, { type: "MULTI_FACE_SENT" }).state).toBe(v_ca01e0);
  });

  it("다른 사람으로 갈아타면 그 통보로 서버가 다시 알게 되므로 표시를 내린다", () => {
    const v_3f6eae = v_729796(v_30b0d4(), { type: "MULTI_FACE_SENT" }).state;
    const v_cb35cb = v_729796(v_3f6eae, v_d81543(77, { name: "민경" }), 1000);
    expect(v_cb35cb.actions.some((v_779914) => v_779914.type === "NOTIFY_CONFIRMED")).toBe(true);
    expect(v_cb35cb.state.serverSpeakerCleared).toBe(false);
  });
});
