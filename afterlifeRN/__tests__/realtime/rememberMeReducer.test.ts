import {
  ENROLL_GRACE_MS,
  GRACE_HOLD_MS,
  initRememberMeState,
  rememberMeReducer,
  shouldHoldMic,
  shouldShowRememberMeButton,
  UNKNOWN_RENOTIFY_MS,
  type RememberMeState,
} from "../../src/realtime/rememberMeReducer";

const step = (
  s: RememberMeState,
  e: Parameters<typeof rememberMeReducer>[1],
  nowMs = 0,
) => rememberMeReducer(s, e, nowMs);

const known = (
  personId: number,
  opts: { named?: boolean; cloneSpeaking?: boolean; name?: string | null } = {},
) =>
  ({
    type: "MATCH_KNOWN",
    personId,
    displayName: opts.name ?? "도기",
    named: opts.named ?? true,
    cloneSpeaking: opts.cloneSpeaking ?? false,
  }) as const;

const identified58 = (nowMs = 0) =>
  step(initRememberMeState(), known(58), nowMs).state;

describe("rememberMeReducer — 확정", () => {
  it("초기 상태는 확인됨 + 시트 닫힘", () => {
    const s = initRememberMeState();
    expect(s.mode).toBe("identified");
    expect(s.sheetOpen).toBe(false);
    expect(shouldShowRememberMeButton(s)).toBe(false);
  });

  it("등록된 얼굴은 **1회 매칭으로 즉시** 확정된다", () => {

    const { state } = step(initRememberMeState(), known(58));
    expect(state.mode).toBe("identified");
    expect(state.personId).toBe(58);
  });

  it("이름 없는 매칭은 확정이 아니다 — unknown 과 동일 취급(교착 방지)", () => {

    const { state } = step(initRememberMeState(), known(45, { named: false }));
    expect(state.mode).toBe("pending");
    expect(shouldShowRememberMeButton(state)).toBe(true);
  });
});

describe("rememberMeReducer — grace(30초 유지)", () => {
  it("확정자를 놓쳐도 즉시 대기로 가지 않는다 — 대화는 계속된다", () => {
    const { state, actions } = step(identified58(), { type: "MATCH_UNKNOWN" }, 1000);
    expect(state.mode).toBe("grace");
    expect(state.graceSinceMs).toBe(1000);
    expect(state.personId).toBe(58); 

    expect(actions).toEqual([]);
    expect(shouldShowRememberMeButton(state)).toBe(false);
  });

  it("unknown 이 반복돼도 유지 기준점이 리셋되지 않는다", () => {

    let s = step(identified58(), { type: "MATCH_UNKNOWN" }, 1000).state;
    s = step(s, { type: "MATCH_UNKNOWN" }, 4000).state;
    s = step(s, { type: "MATCH_UNKNOWN" }, 7000).state;
    expect(s.graceSinceMs).toBe(1000);
  });

  it("30초까지는 그 사람으로 유지한다", () => {
    const s = step(identified58(), { type: "MATCH_UNKNOWN" }, 1000).state;
    const r = step(s, { type: "TICK" }, 1000 + GRACE_HOLD_MS - 1);
    expect(r.state.mode).toBe("grace");
    expect(r.actions).toEqual([]);
  });

  it("30초가 지나고 그 사이 대화가 있었으면 대기로 간다", () => {

    let s = step(identified58(), { type: "MATCH_UNKNOWN" }, 1000).state;
    s = step(s, { type: "ACTIVITY" }, 5000).state;
    const r = step(s, { type: "TICK" }, 1000 + GRACE_HOLD_MS);
    expect(r.state.mode).toBe("pending");
    expect(r.state.sheetOpen).toBe(false);
    expect(r.actions).toEqual([{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }]);
  });

  it("30초가 지나도록 아무 말도 없었으면 통화를 끊는다", () => {

    const s = step(identified58(), { type: "MATCH_UNKNOWN" }, 1000).state;
    const r = step(s, { type: "TICK" }, 1000 + GRACE_HOLD_MS);
    expect(r.actions).toEqual([{ type: "END_CALL" }]);
  });

  it("🔴 붙들고 있던 사람이 돌아오면 인사하지 않고 이름만 부르게 한다", () => {

    const s = step(identified58(), { type: "MATCH_UNKNOWN" }, 1000).state;
    const { state, actions } = step(s, known(58), 5000);
    expect(state.mode).toBe("identified");
    expect(state.graceSinceMs).toBeNull();
    expect(actions).toEqual([
      {
        type: "NOTIFY_CONFIRMED",
        personId: 58,
        displayName: "도기",
        rejoin: false, 
        mentionName: true,
      },
    ]);
  });

  it("확정된 적이 없는 통화의 unknown 은 grace 를 거치지 않고 바로 대기로 간다", () => {

    const { state, actions } = step(initRememberMeState(), { type: "MATCH_UNKNOWN" });
    expect(state.mode).toBe("pending");
    expect(actions).toEqual([{ type: "MIC_OFF" }, { type: "NOTIFY_UNKNOWN" }]);
  });

  it("ACTIVITY 는 유지 시간을 연장하지 않는다 — 갈 곳만 바꾼다", () => {

    let s = step(identified58(), { type: "MATCH_UNKNOWN" }, 1000).state;
    s = step(s, { type: "ACTIVITY" }, 25_000).state;
    expect(s.graceSinceMs).toBe(1000); 
    expect(step(s, { type: "TICK" }, 1000 + GRACE_HOLD_MS).state.mode).toBe("pending");
  });

  it("grace 가 아니면 ACTIVITY 는 아무것도 하지 않는다", () => {
    const before = identified58();
    expect(step(before, { type: "ACTIVITY" }, 5000).state).toEqual(before);
  });

  it("grace 가 아니면 TICK 은 아무것도 하지 않는다", () => {
    expect(step(identified58(), { type: "TICK" }, 10_000_000).actions).toEqual([]);
    const p = step(initRememberMeState(), { type: "MATCH_UNKNOWN" }).state;
    expect(step(p, { type: "TICK" }, 10_000_000).actions).toEqual([]);
  });
});

describe("rememberMeReducer — 다른 사람 등장", () => {
  it("등록된 다른 사람이 오면 즉시 그 사람으로 갈아타고 인사한다", () => {

    const { state, actions } = step(identified58(), known(70, { name: "미미" }));
    expect(state.mode).toBe("identified");
    expect(state.personId).toBe(70);
    expect(actions).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 70, displayName: "미미", rejoin: true },
    ]);
  });

  it("클론이 말하는 중이면 전환을 미룬다 — 하던 말을 끊지 않는다", () => {
    const { state, actions } = step(
      identified58(),
      known(70, { name: "미미", cloneSpeaking: true }),
    );
    expect(state.mode).toBe("identified");
    expect(state.personId).toBe(58); 
    expect(state.pendingSwitch).toEqual({ personId: 70, displayName: "미미" });
    expect(actions).toEqual([]);
  });

  it("클론 발화가 끝나면 미뤄 둔 전환이 실행된다", () => {
    const s = step(identified58(), known(70, { name: "미미", cloneSpeaking: true })).state;
    const { state, actions } = step(s, { type: "CLONE_SPEECH_END" });
    expect(state.personId).toBe(70);
    expect(state.pendingSwitch).toBeNull();
    expect(actions).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 70, displayName: "미미", rejoin: true },
    ]);
  });

  it("미뤄 둔 전환이 없으면 발화 종료는 아무것도 하지 않는다", () => {
    const r = step(identified58(), { type: "CLONE_SPEECH_END" });
    expect(r.actions).toEqual([]);
    expect(r.state.personId).toBe(58);
  });
});

describe("rememberMeReducer — 대기(pending)", () => {
  const pending = () => step(initRememberMeState(), { type: "MATCH_UNKNOWN" }).state;

  it("대기 중에는 버튼이 뜨고 마이크가 닫혀 있다", () => {
    const s = pending();
    expect(shouldShowRememberMeButton(s)).toBe(true);
    expect(shouldHoldMic(s)).toBe(true);
  });

  it("🔴 시트를 닫아도 대기는 유지된다 — 마이크를 열지 않는다", () => {

    const { state, actions } = step(pending(), { type: "DISMISS" });
    expect(state.mode).toBe("pending");
    expect(state.sheetOpen).toBe(false);
    expect(shouldShowRememberMeButton(state)).toBe(true);
    expect(shouldHoldMic(state)).toBe(true);
    expect(actions).toEqual([]); 
  });

  it("닫은 뒤 얼굴이 계속 잡혀도 시트를 다시 강제로 열지 않는다", () => {
    let s = step(pending(), { type: "DISMISS" }).state;
    for (let i = 0; i < 5; i++) {
      const r = step(s, { type: "MATCH_UNKNOWN" }, i * 3000);
      expect(r.state.sheetOpen).toBe(false);
      expect(r.actions).toEqual([]);
      s = r.state;
    }
    expect(s.mode).toBe("pending");
  });

  it("대기가 길어지면 서버에 주기적으로 다시 알린다", () => {

    const s = step(initRememberMeState(), { type: "MATCH_UNKNOWN" }, 1000).state;
    expect(step(s, { type: "MATCH_UNKNOWN" }, 1000 + 30_000).actions).toEqual([]);
    const r = step(s, { type: "MATCH_UNKNOWN" }, 1000 + UNKNOWN_RENOTIFY_MS);
    expect(r.actions).toEqual([{ type: "NOTIFY_UNKNOWN" }]);

    expect(
      step(r.state, { type: "MATCH_UNKNOWN" }, 1000 + UNKNOWN_RENOTIFY_MS + 3000).actions,
    ).toEqual([]);
  });

  it("버튼 탭으로는 다시 열 수 있다", () => {
    const s = step(pending(), { type: "DISMISS" }).state;
    const { state } = step(s, { type: "OPEN_SHEET" });
    expect(state.sheetOpen).toBe(true);
  });

  it("아는 얼굴이 돌아오면 대기가 풀리고 재인사한다 — 유일한 자동 해제 경로", () => {
    const { state, actions } = step(pending(), known(58));
    expect(state.mode).toBe("identified");
    expect(state.personId).toBe(58);
    expect(state.sheetOpen).toBe(false);
    expect(actions).toEqual([
      { type: "MIC_ON" },
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: true },
    ]);
  });

  it("등록을 마치면 대기가 풀리고 마이크가 열린다", () => {
    const { state, actions } = step(pending(), { type: "ENROLLED" }, 1000);
    expect(state.mode).toBe("identified");
    expect(state.sheetOpen).toBe(false);
    expect(actions).toEqual([{ type: "MIC_ON" }]);
  });
});

describe("rememberMeReducer — 시트와 마이크", () => {
  it("확정된 사람이 이름을 고치려 열면 신원은 흔들리지 않되 마이크는 닫힌다", () => {
    const { state, actions } = step(identified58(), { type: "OPEN_SHEET" });
    expect(state.mode).toBe("identified");
    expect(state.sheetOpen).toBe(true);
    expect(actions).toEqual([{ type: "MIC_OFF" }]);
    expect(shouldHoldMic(state)).toBe(true);
  });

  it("확정 상태에서 닫으면 마이크가 돌아온다", () => {
    const s = step(identified58(), { type: "OPEN_SHEET" }).state;
    const { state, actions } = step(s, { type: "DISMISS" });
    expect(state.sheetOpen).toBe(false);
    expect(actions).toEqual([{ type: "MIC_ON" }]);
  });

  it("마이크 신호는 실제로 바뀔 때만 낸다", () => {

    const s = step(identified58(), { type: "OPEN_SHEET" }).state;
    expect(step(s, { type: "OPEN_SHEET" }).actions).toEqual([]);
    const c = step(s, { type: "DISMISS" }).state;
    expect(step(c, { type: "DISMISS" }).actions).toEqual([]);
  });
});

describe("rememberMeReducer — 등록 직후 유예", () => {

  it("등록 직후의 unknown 은 대기로 보내지 않는다", () => {
    const s = step(initRememberMeState(), { type: "ENROLLED" }, 1000).state;
    const { state, actions } = step(s, { type: "MATCH_UNKNOWN" }, 1000 + 30_000);
    expect(state.mode).toBe("identified");
    expect(actions).toEqual([]);
  });

  it("유예가 지나면 다시 대기로 떨어진다 — 등록이 끝내 반영 안 될 때의 탈출구", () => {
    const s = step(initRememberMeState(), { type: "ENROLLED" }, 1000).state;
    const { state } = step(s, { type: "MATCH_UNKNOWN" }, 1000 + ENROLL_GRACE_MS + 1);
    expect(state.mode).toBe("pending");
  });

  it("매칭이 돌아오면 유예는 즉시 끝난다", () => {
    let s = step(initRememberMeState(), { type: "ENROLLED" }, 1000).state;
    s = step(s, known(58), 6000).state;
    expect(s.enrollGraceUntilMs).toBeNull();

    const { state } = step(s, { type: "MATCH_UNKNOWN" }, 7000);
    expect(state.mode).toBe("grace");
  });

  it("유예 중 이름 없는 매칭도 대기로 보내지 않는다 — unknown 위임 경로", () => {
    const s = step(initRememberMeState(), { type: "ENROLLED" }, 1000).state;
    const { state } = step(s, known(45, { named: false }), 11_000);
    expect(state.mode).toBe("identified");
  });
});

describe("rememberMeReducer — 순수성", () => {
  it("입력 상태를 변형하지 않는다", () => {
    const s0 = identified58();
    const snapshot = JSON.stringify(s0);
    step(s0, { type: "MATCH_UNKNOWN" });
    step(s0, { type: "ACTIVITY" });
    step(s0, known(70));
    expect(JSON.stringify(s0)).toBe(snapshot);
  });
});

describe("rememberMeReducer — T-559 프로액티브 sheet (score gate)", () => {
  it("score 미제공 (undefined) — sheet 자동 open 안 함 (T-557 기본)", () => {
    const { state } = step(initRememberMeState(), { type: "MATCH_UNKNOWN" }, 1000);
    expect(state.mode).toBe("pending");
    expect(state.sheetOpen).toBe(false);
    expect(shouldShowRememberMeButton(state)).toBe(true);
  });

  it("score === 0 — sheet 자동 open 안 함 (DB 비어있음 · 완전 미확정 케이스)", () => {
    const { state } = step(initRememberMeState(), { type: "MATCH_UNKNOWN", score: 0 }, 1000);
    expect(state.mode).toBe("pending");
    expect(state.sheetOpen).toBe(false);
  });

  it("score > 0 — 프로액티브 sheet 자동 open (다른 사람 가능성)", () => {
    const { state } = step(initRememberMeState(), { type: "MATCH_UNKNOWN", score: 0.25 }, 1000);
    expect(state.mode).toBe("pending");
    expect(state.sheetOpen).toBe(true);
    expect(shouldHoldMic(state)).toBe(true);
  });

  it("score > 0 이라도 확정자가 있으면 grace 로 감 (sheet 자동 open X · 그 사람 유지)", () => {

    const { state } = step(identified58(), { type: "MATCH_UNKNOWN", score: 0.3 }, 1000);
    expect(state.mode).toBe("grace");
    expect(state.sheetOpen).toBe(false);
  });

  it("grace 만료로 TICK → pending 진입 시엔 sheet 자동 open X (자리 뜬 케이스)", () => {

    let s = step(identified58(), { type: "MATCH_UNKNOWN", score: 0.3 }, 1000).state;
    s = step(s, { type: "ACTIVITY" }, 5_000).state;
    const { state } = step(s, { type: "TICK" }, 1000 + GRACE_HOLD_MS);
    expect(state.mode).toBe("pending");
    expect(state.sheetOpen).toBe(false);
  });
});
