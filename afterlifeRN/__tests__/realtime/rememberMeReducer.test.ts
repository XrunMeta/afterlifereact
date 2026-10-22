import {
  v_6d5c2a,
  v_a5c955,
  v_178dfb,
  v_706a74,
  v_b94941,
  v_f8761c,
  v_059bf8,
  type v_8118fb,
} from "../../src/realtime/rememberMeReducer";
import type { v_516d40 } from "../../src/face/faceTurnJudge";

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

const v_1b0e1d = (
  kind: v_516d40["kind"],
  v_ca1ec5 = null,
  v_67e77e = 0,
  v_8a1355 = null,
) =>
  ({
    type: "TURN_VERDICT",
    verdict: { kind: v_94302c, personId: v_ca1ec5, score: v_ca1ec5 == null ? null : 0.8, quality: "ok" },
    displayName: v_8a1355,
    nowMs: v_67e77e,
  }) as const;

const v_192ddf = (
  v_ca1ec5,
  v_67e77e = 0,
  v_328259 = {},
) =>
  ({
    type: "WHO_RETRY_RESULT",
    personId: v_ca1ec5,
    displayName: v_328259.name ?? null,
    selfMatch: v_328259.selfMatch ?? false,
    nowMs: v_67e77e,
  }) as const;

const v_9962af = (v_ffbb27, v_67e77e) =>
  ({ type: "FACE_PRESENCE", present: v_ffbb27, nowMs: v_67e77e }) as const;

const v_30b0d4 = (v_67e77e = 0) =>
  v_729796(v_178dfb(), v_d81543(58), v_67e77e).state;

const v_4ce118 = (over: Partial<v_8118fb> = {}): v_8118fb => ({
  ...v_178dfb(),
  mode: "pending",
  personId: null,
  lastNotifyUnknownMs: 1000,
  ...v_b71f86,
});

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

  it("이름 없는 매칭은 확정이 아니다 — 신원도 세우지 않고 대기로도 보내지 않는다", () => {

    let v_fd5f43 = v_729796(v_178dfb(), v_d81543(45, { named: false })).state;
    v_fd5f43 = v_729796(v_fd5f43, v_d81543(45, { named: false }), 500).state;
    expect(v_fd5f43.personId).toBeNull();
    expect(v_fd5f43.mode).toBe("identified");
    expect(v_fd5f43.promptRegister).toBe(false);
  });
});

describe("rememberMeReducer — 대조 1회로는 화자를 놓거나 바꾸지 않는다 (AFL-1039)", () => {
  it("MATCH_UNKNOWN while identified no longer opens prompt", () => {
    let v_fd5f43 = v_30b0d4();
    for (let v_ebec57 = 1; v_ebec57 <= 10; v_ebec57++) {
      const v_cb35cb = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN", score: 0.7, topPersonId: 99, hasFace: true }, v_ebec57 * 2000);
      expect(v_cb35cb.actions).toEqual([]);
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.mode).toBe("identified");
    expect(v_fd5f43.personId).toBe(58);
    expect(v_fd5f43.promptRegister).toBe(false);
    expect(v_fd5f43.graceSinceMs).toBeNull();
  });

  it("확정된 적 없는 통화에서도 MATCH_UNKNOWN 은 팝업·대기로 승격하지 않는다", () => {
    let v_fd5f43 = v_178dfb();
    for (let v_ebec57 = 1; v_ebec57 <= 10; v_ebec57++) {
      const v_cb35cb = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN", score: 0.7, hasFace: true }, v_ebec57 * 2000);
      expect(v_cb35cb.actions).toEqual([]);
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.mode).toBe("identified");
    expect(v_fd5f43.promptRegister).toBe(false);
  });

  it("확정자가 있을 때 다른 사람 MATCH_KNOWN 은 화자를 바꾸지 않는다 — 전환은 턴 판정만", () => {
    const v_e98932 = v_30b0d4();
    const v_cb35cb = v_729796(v_e98932, v_d81543(70, { name: "미미", cloneSpeaking: true }), 1000);
    expect(v_cb35cb.state).toBe(v_e98932);
    expect(v_cb35cb.actions).toEqual([]);
  });

  it("같은 사람 MATCH_KNOWN 은 기존대로 조용히 recentlySeen 만 갱신한다", () => {
    const v_cb35cb = v_729796(v_30b0d4(), v_d81543(58), 5000);
    expect(v_cb35cb.actions).toEqual([]);
    expect(v_cb35cb.state.recentlySeen[58]).toBe(5000);
  });

  it("미뤄 둔 전환이 없으면 발화 종료는 아무것도 하지 않는다", () => {
    const v_cb35cb = v_729796(v_30b0d4(), { type: "CLONE_SPEECH_END" });
    expect(v_cb35cb.actions).toEqual([]);
    expect(v_cb35cb.state.personId).toBe(58);
  });
});

describe("rememberMeReducer — 턴 판정 (TURN_VERDICT)", () => {
  it("TURN_VERDICT unknown opens register prompt", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_30b0d4(), v_1b0e1d("unknown", null, 3000), 3000);
    expect(v_b6e533.promptRegister).toBe(true);
    expect(v_b94941(v_b6e533)).toBe(true);
    expect(v_dd943a).toEqual([{ type: "MIC_OFF" }]);

    expect(v_b6e533.personId).toBe(58);
    expect(v_b6e533.lastConfirmedPerson).toEqual({ personId: 58, displayName: "도기" });
  });

  it("TURN_VERDICT unknown after DISMISS_LATER does not reopen", () => {
    let v_fd5f43 = v_729796(v_30b0d4(), v_1b0e1d("unknown", null, 3000), 3000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "DISMISS_LATER" }, 4000).state;
    expect(v_fd5f43.dismissedPromptInCall).toBe(true);
    const v_cb35cb = v_729796(v_fd5f43, v_1b0e1d("unknown", null, 9000), 9000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.actions).toEqual([]);
  });

  it("TURN_VERDICT unknown 은 이미 팝업·시트가 떠 있으면 중복으로 열지 않는다", () => {
    const v_a274a9 = v_729796(v_30b0d4(), v_1b0e1d("unknown", null, 3000), 3000).state;
    const v_826279 = v_729796(v_a274a9, v_1b0e1d("unknown", null, 5000), 5000);
    expect(v_826279.state).toBe(v_a274a9);
    expect(v_826279.actions).toEqual([]);

    const v_fd08c6 = v_729796(v_30b0d4(), { type: "OPEN_SHEET" }).state;
    const v_cb35cb = v_729796(v_fd08c6, v_1b0e1d("unknown", null, 5000), 5000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.actions).toEqual([]);
  });

  it("TURN_VERDICT switch identifies new person and notifies", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_30b0d4(), v_1b0e1d("switch", 70, 3000, "미미"), 3000);
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(70);
    expect(v_b6e533.lastConfirmedPerson).toEqual({ personId: 70, displayName: "미미" });
    expect(v_b6e533.recentlySeen[70]).toBe(3000);

    expect(v_dd943a).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 70, displayName: "미미", rejoin: false, mentionName: false },
    ]);
  });

  it("TURN_VERDICT switch — 오래 전에 봤던 사람으로 바뀌면 rejoin, 최근에 봤으면 이름만", () => {

    const v_260c21 = v_729796(v_178dfb(), v_d81543(70, { name: "미미" }), 0).state;
    const v_7c2531 = v_729796(v_260c21, v_1b0e1d("switch", 58, 1000, "도기"), 1000).state;
    const v_e5084e = v_729796(v_7c2531, v_1b0e1d("switch", 70, 200_000, "미미"), 200_000);
    expect(v_e5084e.actions).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 70, displayName: "미미", rejoin: true, mentionName: false },
    ]);
    const v_23e40a = v_729796(v_7c2531, v_1b0e1d("switch", 70, 30_000, "미미"), 30_000);
    expect(v_23e40a.actions).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 70, displayName: "미미", rejoin: false, mentionName: true },
    ]);
  });

  it("TURN_VERDICT switch — 화자가 없을 때는 첫 확정(대기 해제 + MIC_ON)", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_4ce118(), v_1b0e1d("switch", 58, 3000, "도기"), 3000);
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(58);
    expect(v_dd943a).toEqual([
      { type: "MIC_ON" },
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: false, mentionName: false },
    ]);
  });

  it("TURN_VERDICT switch 는 multi_face 표시도 내린다 — 통보로 서버가 다시 안다", () => {
    const v_3f6eae = v_729796(v_30b0d4(), { type: "MULTI_FACE_SENT" }).state;
    const v_cb35cb = v_729796(v_3f6eae, v_1b0e1d("switch", 77, 1000, "민경"), 1000);
    expect(v_cb35cb.actions.some((v_779914) => v_779914.type === "NOTIFY_CONFIRMED")).toBe(true);
    expect(v_cb35cb.state.serverSpeakerCleared).toBe(false);
  });

  it("TURN_VERDICT known keeps state", () => {
    const v_e98932 = v_30b0d4();
    for (const v_94302c of ["known", "insufficient"] as const) {
      const v_cb35cb = v_729796(v_e98932, v_1b0e1d(v_94302c, v_94302c === "known" ? 58 : null, 3000), 3000);
      expect(v_cb35cb.state).toBe(v_e98932);
      expect(v_cb35cb.actions).toEqual([]);
    }
  });
});

describe("rememberMeReducer — '나 누구야?' 재대조 (WHO_RETRY_RESULT)", () => {
  it("WHO_RETRY_RESULT known identifies", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_178dfb(), v_192ddf(58, 3000, { name: "도기" }), 3000);
    expect(v_b6e533.personId).toBe(58);
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.promptRegister).toBe(false);
    expect(v_dd943a).toEqual([
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: false, mentionName: false },
    ]);
  });

  it("WHO_RETRY_RESULT null opens prompt even after DISMISS_LATER", () => {
    let v_fd5f43 = v_729796(v_30b0d4(), v_1b0e1d("unknown", null, 3000), 3000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "DISMISS_LATER" }, 4000).state;
    expect(v_fd5f43.dismissedPromptInCall).toBe(true);
    const v_cb35cb = v_729796(v_fd5f43, v_192ddf(null, 9000), 9000);
    expect(v_cb35cb.state.promptRegister).toBe(true);
    expect(v_cb35cb.actions).toEqual([{ type: "MIC_OFF" }]);
  });

  it("WHO_RETRY_RESULT selfMatch 는 팝업만 연다(본인 처리는 화면 몫)", () => {
    const v_cb35cb = v_729796(v_30b0d4(), v_192ddf(null, 9000, { selfMatch: true }), 9000);
    expect(v_cb35cb.state.promptRegister).toBe(true);
    expect(v_cb35cb.state.personId).toBe(58);
    expect(v_cb35cb.actions).toEqual([{ type: "MIC_OFF" }]);
  });

  it("WHO_RETRY_RESULT null 도 이미 팝업이 떠 있으면 중복 액션이 없다", () => {
    const v_a274a9 = v_729796(v_30b0d4(), v_1b0e1d("unknown", null, 3000), 3000).state;
    const v_cb35cb = v_729796(v_a274a9, v_192ddf(null, 5000), 5000);
    expect(v_cb35cb.state).toBe(v_a274a9);
    expect(v_cb35cb.actions).toEqual([]);
  });
});

describe("rememberMeReducer — 자리 비움 (FACE_PRESENCE)", () => {
  it("FACE_PRESENCE absent 60s without activity → END_CALL", () => {
    let v_fd5f43 = v_729796(v_30b0d4(), v_9962af(false, 1000), 1000).state;
    expect(v_fd5f43.absentSinceMs).toBe(1000);

    v_fd5f43 = v_729796(v_fd5f43, v_9962af(false, 30_000), 30_000).state;
    expect(v_fd5f43.absentSinceMs).toBe(1000);
    expect(v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_6d5c2a - 1).actions).toEqual([]);
    const v_cb35cb = v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_6d5c2a);
    expect(v_cb35cb.actions).toEqual([{ type: "END_CALL" }]);

    expect(v_729796(v_cb35cb.state, { type: "TICK" }, 1000 + v_6d5c2a + 5000).actions).toEqual([]);
  });

  it("FACE_PRESENCE absent 60s with ACTIVITY → no END_CALL", () => {
    let v_fd5f43 = v_729796(v_30b0d4(), v_9962af(false, 1000), 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, { type: "ACTIVITY" }, 40_000).state;
    expect(v_fd5f43.lastActivityMs).toBe(40_000);
    expect(v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_6d5c2a).actions).toEqual([]);

    expect(v_729796(v_fd5f43, { type: "TICK" }, 40_000 + v_6d5c2a).actions).toEqual([{ type: "END_CALL" }]);
  });

  it("FACE_PRESENCE present clears absence", () => {
    let v_fd5f43 = v_729796(v_30b0d4(), v_9962af(false, 1000), 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, v_9962af(true, 20_000), 20_000).state;
    expect(v_fd5f43.absentSinceMs).toBeNull();
    expect(v_729796(v_fd5f43, { type: "TICK" }, 1000 + v_6d5c2a + 1).actions).toEqual([]);
  });

  it("얼굴이 보이는 동안 TICK 은 아무것도 하지 않는다", () => {
    const v_e98932 = v_30b0d4();
    expect(v_729796(v_e98932, { type: "TICK" }, 10_000_000)).toEqual({ state: v_e98932, actions: [] });
  });

  it("ACTIVITY 는 마지막 대화 시각만 기록한다 — 신원·모드는 그대로", () => {
    const v_e98932 = v_30b0d4();
    const v_33efc5 = v_729796(v_e98932, { type: "ACTIVITY" }, 5000).state;
    expect(v_33efc5).toEqual({ ...v_e98932, lastActivityMs: 5000 });
  });
});

describe("rememberMeReducer — 대기(pending)", () => {
  it("대기 중에는 버튼이 뜨고 마이크가 닫혀 있다", () => {
    const v_fd5f43 = v_4ce118();
    expect(v_f8761c(v_fd5f43)).toBe(true);
    expect(v_b94941(v_fd5f43)).toBe(true);
  });

  it("🔴 시트를 닫아도 대기는 유지된다 — 마이크를 열지 않는다", () => {

    const v_a274a9 = { ...v_4ce118(), sheetOpen: true };
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_a274a9, { type: "DISMISS" });
    expect(v_b6e533.mode).toBe("pending");
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_f8761c(v_b6e533)).toBe(true);
    expect(v_b94941(v_b6e533)).toBe(true);
    expect(v_dd943a).toEqual([]); 
  });

  it("닫은 뒤 얼굴이 계속 잡혀도 시트를 다시 강제로 열지 않는다", () => {
    let v_fd5f43 = v_4ce118();
    for (let v_ebec57 = 0; v_ebec57 < 5; v_ebec57++) {
      const v_cb35cb = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1000 + v_ebec57 * 3000);
      expect(v_cb35cb.state.sheetOpen).toBe(false);
      expect(v_cb35cb.state.promptRegister).toBe(false);
      expect(v_cb35cb.actions).toEqual([]);
      v_fd5f43 = v_cb35cb.state;
    }
    expect(v_fd5f43.mode).toBe("pending");
  });

  it("대기가 길어지면 서버에 주기적으로 다시 알린다", () => {

    const v_fd5f43 = v_4ce118({ lastNotifyUnknownMs: 1500 });
    expect(v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1500 + 1000).actions).toEqual([]);
    const v_cb35cb = v_729796(v_fd5f43, { type: "MATCH_UNKNOWN" }, 1500 + v_059bf8);
    expect(v_cb35cb.actions).toEqual([{ type: "NOTIFY_UNKNOWN" }]);

    expect(
      v_729796(v_cb35cb.state, { type: "MATCH_UNKNOWN" }, 1500 + v_059bf8 + 3000).actions,
    ).toEqual([]);
  });

  it("버튼 탭으로는 다시 열 수 있다", () => {
    const { state: v_b6e533 } = v_729796(v_4ce118(), { type: "OPEN_SHEET" });
    expect(v_b6e533.sheetOpen).toBe(true);
  });

  it("아는 얼굴이 처음으로 잡히면 대기가 풀리고 조용히 확정 (재인사 X · T-561)", () => {

    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_4ce118(), v_d81543(58));
    expect(v_b6e533.mode).toBe("identified");
    expect(v_b6e533.personId).toBe(58);
    expect(v_b6e533.sheetOpen).toBe(false);
    expect(v_dd943a).toEqual([
      { type: "MIC_ON" },
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: false, mentionName: false },
    ]);
  });

  it("오래 전 (90초 초과) 봤던 사람이 pending 후 돌아오면 rejoin=true (다시 오셨네요)", () => {
    const v_fd5f43 = v_4ce118({ recentlySeen: { 58: 0 } });
    const { actions: v_dd943a } = v_729796(v_fd5f43, v_d81543(58), 200_000);
    expect(v_dd943a).toEqual([
      { type: "MIC_ON" },
      { type: "NOTIFY_CONFIRMED", personId: 58, displayName: "도기", rejoin: true, mentionName: false },
    ]);
  });

  it("등록을 마치면 대기가 풀리고 마이크가 열린다", () => {
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_4ce118(), { type: "ENROLLED" }, 1000);
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

  it("등록 직후의 TURN_VERDICT unknown·재대조 실패는 팝업을 열지 않는다", () => {
    const v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED" }, 1000).state;
    expect(v_729796(v_fd5f43, v_1b0e1d("unknown", null, 31_000), 31_000).state.promptRegister).toBe(false);
    expect(v_729796(v_fd5f43, v_192ddf(null, 31_000), 31_000).state.promptRegister).toBe(false);
  });

  it("유예가 지나면 턴 판정 unknown 이 다시 팝업을 연다 — 등록이 끝내 반영 안 될 때의 탈출구", () => {
    const v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED" }, 1000).state;
    const v_83d291 = 1000 + v_a5c955 + 1;
    const v_cb35cb = v_729796(v_fd5f43, v_1b0e1d("unknown", null, v_83d291), v_83d291);
    expect(v_cb35cb.state.promptRegister).toBe(true);
  });

  it("매칭이 돌아오면 유예는 즉시 끝난다", () => {
    let v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED" }, 1000).state;
    v_fd5f43 = v_729796(v_fd5f43, v_d81543(58), 6000).state;
    expect(v_fd5f43.enrollGraceUntilMs).toBeNull();

    const { state: v_b6e533 } = v_729796(v_fd5f43, v_1b0e1d("unknown", null, 7000), 7000);
    expect(v_b6e533.promptRegister).toBe(true);
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
    v_729796(v_ca01e0, v_1b0e1d("switch", 70, 1000), 1000);
    v_729796(v_ca01e0, v_1b0e1d("unknown", null, 1000), 1000);
    v_729796(v_ca01e0, v_9962af(false, 1000), 1000);
    expect(JSON.stringify(v_ca01e0)).toBe(v_5392c4);
  });
});

describe("rememberMeReducer — 새 얼굴 팝업 응답 (T-562)", () => {

  const v_4bf43e = () => v_729796(v_30b0d4(500), v_1b0e1d("unknown", null, 1000), 1000).state;

  const v_f3ae42 = () => v_729796(v_178dfb(), v_1b0e1d("unknown", null, 1000), 1000).state;

  it("T-562 · CONFIRM_PROMPT — 팝업만 닫는다", () => {
    const v_fd5f43 = v_4bf43e();
    const v_cb35cb = v_729796(v_fd5f43, { type: "CONFIRM_PROMPT" }, 2000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.mode).toBe(v_fd5f43.mode);
    expect(v_cb35cb.actions).toEqual([]); 
  });

  it("T-562 · DISMISS_PROMPT — 팝업만 닫는다 (하위호환)", () => {
    const v_fd5f43 = v_4bf43e();
    const v_cb35cb = v_729796(v_fd5f43, { type: "DISMISS_PROMPT" }, 2000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.mode).toBe(v_fd5f43.mode);
    expect(v_cb35cb.actions).toEqual([]);
  });

  it("T-562 (B안) · CONFIRM_SAME_PERSON — lastConfirmedPerson 복원 + MIC_ON + dismiss 플래그", () => {
    const v_fd5f43 = v_4bf43e();
    expect(v_fd5f43.lastConfirmedPerson).toEqual({ personId: 58, displayName: "도기" });
    const v_cb35cb = v_729796(v_fd5f43, { type: "CONFIRM_SAME_PERSON" }, 10_000);
    expect(v_cb35cb.state.mode).toBe("identified");
    expect(v_cb35cb.state.personId).toBe(58);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.dismissedPromptInCall).toBe(true);
    expect(v_cb35cb.actions).toContainEqual({ type: "MIC_ON" });
  });

  it("T-562 (B안) · CONFIRM_SAME_PERSON — 복원할 person 없으면 DISMISS_LATER 처럼 처리", () => {
    const v_fd5f43 = v_f3ae42();
    expect(v_fd5f43.lastConfirmedPerson).toBeNull();
    expect(v_fd5f43.promptRegister).toBe(true);
    const v_cb35cb = v_729796(v_fd5f43, { type: "CONFIRM_SAME_PERSON" }, 2000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.dismissedPromptInCall).toBe(true);
    expect(v_cb35cb.state.mode).toBe("identified");
    expect(v_cb35cb.state.personId).toBeNull();
    expect(v_cb35cb.actions).toContainEqual({ type: "MIC_ON" });
  });

  it("T-562 (B안) · DISMISS_LATER — 팝업 닫기 + MIC_ON + 이번 통화 재출현 억제", () => {
    const v_fd5f43 = v_f3ae42();
    const v_cb35cb = v_729796(v_fd5f43, { type: "DISMISS_LATER" }, 2000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.dismissedPromptInCall).toBe(true);
    expect(v_cb35cb.state.mode).toBe("identified");
    expect(v_cb35cb.actions).toContainEqual({ type: "MIC_ON" });
  });

  it("T-562 (B안) · ENROLLED 는 dismissedPromptInCall 을 리셋 (등록 완료 = 클린 슬레이트)", () => {
    let v_fd5f43 = v_729796(v_f3ae42(), { type: "DISMISS_LATER" }, 2000).state;
    expect(v_fd5f43.dismissedPromptInCall).toBe(true);
    const v_cb35cb = v_729796(v_fd5f43, { type: "ENROLLED" }, 3000);
    expect(v_cb35cb.state.dismissedPromptInCall).toBe(false);
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
});

describe("새 얼굴 팝업이 떠 있는 동안 마이크 대기", () => {

  const v_e170e6 = (): v_8118fb => ({
    ...v_30b0d4(),
    mode: "pending",
    personId: null,
    promptRegister: true,
    lastNotifyUnknownMs: 1000,
  });

  it("팝업 중 아는 얼굴이 돌아와도 MIC_ON 을 내지 않고 마이크를 계속 보류한다", () => {
    const v_cb35cb = v_729796(v_e170e6(), v_d81543(58), 40_000);
    expect(v_cb35cb.state.mode).toBe("identified");
    expect(v_cb35cb.state.promptRegister).toBe(true);
    expect(v_cb35cb.actions.some((v_779914) => v_779914.type === "MIC_ON")).toBe(false);
    expect(v_cb35cb.actions.some((v_779914) => v_779914.type === "NOTIFY_CONFIRMED")).toBe(true);
    expect(v_b94941(v_cb35cb.state)).toBe(true);
  });

  it("그 뒤 '나중에' 로 닫으면 마이크가 열리고, 돌아온 신원은 지우지 않는다", () => {
    const v_fd5f43 = v_729796(v_e170e6(), v_d81543(58), 40_000).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "DISMISS_LATER" }, 41_000);
    expect(v_cb35cb.state.promptRegister).toBe(false);
    expect(v_cb35cb.state.personId).toBe(58);
    expect(v_cb35cb.actions).toContainEqual({ type: "MIC_ON" });
    expect(v_b94941(v_cb35cb.state)).toBe(false);
  });

  it("그 뒤 '본인' 으로 닫아도 마이크가 열린다", () => {
    const v_fd5f43 = v_729796(v_e170e6(), v_d81543(58), 40_000).state;
    const v_cb35cb = v_729796(v_fd5f43, { type: "CONFIRM_SAME_PERSON" }, 41_000);
    expect(v_cb35cb.state.personId).toBe(58);
    expect(v_b94941(v_cb35cb.state)).toBe(false);
  });

  it("팝업이 없을 때 pending 에서 아는 얼굴 복귀는 기존처럼 MIC_ON", () => {
    const v_cb35cb = v_729796({ ...v_e170e6(), promptRegister: false }, v_d81543(58), 40_000);
    expect(v_cb35cb.actions).toContainEqual({ type: "MIC_ON" });
    expect(v_b94941(v_cb35cb.state)).toBe(false);
  });

  it("팝업 중 턴 판정 switch 로 확정돼도 마이크는 팝업을 닫을 때 연다", () => {
    const v_cb35cb = v_729796(v_e170e6(), v_1b0e1d("switch", 58, 40_000, "도기"), 40_000);
    expect(v_cb35cb.state.personId).toBe(58);
    expect(v_cb35cb.actions.some((v_779914) => v_779914.type === "MIC_ON")).toBe(false);
    expect(v_b94941(v_cb35cb.state)).toBe(true);
  });
});

describe("통화 중 등록 직후 같은 사람이 잡히면 발화를 끊지 않는다", () => {

  it("ENROLLED 에 personId 를 주면 그 사람으로 확정되고, 이후 같은 사람 매칭은 조용하다", () => {
    const v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED", personId: 167, displayName: "하루" }, 1000).state;
    expect(v_fd5f43.mode).toBe("identified");
    expect(v_fd5f43.personId).toBe(167);
    const { state: v_b6e533, actions: v_dd943a } = v_729796(v_fd5f43, v_d81543(167, { name: "하루", cloneSpeaking: true }), 1000 + 70_000);
    expect(v_b6e533.personId).toBe(167);
    expect(v_dd943a.some((v_779914) => v_779914.type === "INTERRUPT_TTS")).toBe(false);
  });

  it("아무도 확정 안 된 상태의 첫 확정은 클론이 말하는 중이어도 끊지 않는다", () => {
    const v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED" }, 1000).state;
    const { actions: v_dd943a } = v_729796(v_fd5f43, v_d81543(70, { name: "미미", cloneSpeaking: true }), 2000);
    expect(v_dd943a.some((v_779914) => v_779914.type === "INTERRUPT_TTS")).toBe(false);
  });

  it("등록 직후 다른 사람 매칭은 화자를 바꾸지도, 발화를 끊지도 않는다 (AFL-1039)", () => {
    const v_fd5f43 = v_729796(v_178dfb(), { type: "ENROLLED", personId: 167, displayName: "하루" }, 1000).state;
    const v_cb35cb = v_729796(v_fd5f43, v_d81543(70, { name: "미미", cloneSpeaking: true }), 2000);
    expect(v_cb35cb.state.personId).toBe(167);
    expect(v_cb35cb.actions).toEqual([]);
  });
});
