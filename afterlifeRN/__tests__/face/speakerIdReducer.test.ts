import {
  speakerIdReducer,
  INITIAL_SPEAKER_STATE,
  UNKNOWN_FACE_REEMIT_MS,
  CONFIRM_STREAK,
  UNCONFIRM_STREAK,
  SpeakerIdState,
} from "../../src/face/speakerIdReducer";

const T0 = 0;

it("같은 personId 3연속 → 3번째에 speaker_confirmed 1회, 4번째부터 null", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const cycle = { personId: 7, displayName: "철수", score: 0.9 };

  let r = speakerIdReducer(s, cycle, T0);
  expect(r.event).toBeNull();
  s = r.state;

  r = speakerIdReducer(s, cycle, T0);
  expect(r.event).toBeNull();
  s = r.state;

  r = speakerIdReducer(s, cycle, T0);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 7, displayName: "철수" });
  s = r.state;

  r = speakerIdReducer(s, cycle, T0);
  expect(r.event).toBeNull();
});

it("2연속 후 다른 person → streak 리셋, 이벤트 없음", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 1, displayName: "A", score: 0.9 };
  const b = { personId: 2, displayName: "B", score: 0.9 };

  let r = speakerIdReducer(s, a, T0);
  s = r.state;
  r = speakerIdReducer(s, a, T0);
  s = r.state;
  expect(s.streak).toBe(2);

  r = speakerIdReducer(s, b, T0);
  expect(r.event).toBeNull();
  expect(r.state.streak).toBe(1);
  expect(r.state.candidate).toBe(2);
});

it("null(unknown) 3연속 → unknown_face 1회", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const u = { personId: null, displayName: null, score: 0 };

  let r = speakerIdReducer(s, u, T0);
  s = r.state;
  r = speakerIdReducer(s, u, T0);
  s = r.state;
  r = speakerIdReducer(s, u, T0);
  expect(r.event).toEqual({ type: "unknown_face" });
});

it("confirmed A 상태에서 B 3연속 → B로 speaker_confirmed(화자 교대)", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 1, displayName: "A", score: 0.9 };
  const b = { personId: 2, displayName: "B", score: 0.9 };

  let r = speakerIdReducer(s, a, T0);
  s = r.state;
  r = speakerIdReducer(s, a, T0);
  s = r.state;
  r = speakerIdReducer(s, a, T0);
  s = r.state;
  expect(s.confirmed).toBe(1);

  r = speakerIdReducer(s, b, T0);
  expect(r.event).toBeNull();
  s = r.state;
  r = speakerIdReducer(s, b, T0);
  expect(r.event).toBeNull();
  s = r.state;
  r = speakerIdReducer(s, b, T0);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 2, displayName: "B" });
});

it("이미 confirmed된 대상과 같은 후보가 다시 3연속 되어도 이벤트 재발행 금지", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 1, displayName: "A", score: 0.9 };
  const b = { personId: 2, displayName: "B", score: 0.9 };

  for (let i = 0; i < 3; i++) {
    const r = speakerIdReducer(s, a, T0);
    s = r.state;
  }
  expect(s.confirmed).toBe(1);

  let r = speakerIdReducer(s, b, T0);
  s = r.state;
  r = speakerIdReducer(s, b, T0);
  s = r.state;

  r = speakerIdReducer(s, a, T0);
  expect(r.event).toBeNull(); 
  s = r.state;
  r = speakerIdReducer(s, a, T0);
  expect(r.event).toBeNull(); 
  s = r.state;
  r = speakerIdReducer(s, a, T0);
  expect(r.event).toBeNull(); 
  expect(r.state.confirmed).toBe(1);
});

it("confirmed unknown 상태에서 known으로 3연속 → known으로 speaker_confirmed", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const u = { personId: null, displayName: null, score: 0 };
  const a = { personId: 5, displayName: "철수", score: 0.9 };

  for (let i = 0; i < 3; i++) {
    const r = speakerIdReducer(s, u, T0);
    s = r.state;
  }
  expect(s.confirmed).toBe("unknown");

  let r = speakerIdReducer(s, a, T0);
  s = r.state;
  r = speakerIdReducer(s, a, T0);
  s = r.state;
  r = speakerIdReducer(s, a, T0);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 5, displayName: "철수" });
});

it("streak은 항상 정수이며 음수/NaN이 되지 않는다(경계)", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 1, displayName: "A", score: 0.9 };
  const r = speakerIdReducer(s, a, T0);
  expect(r.state.streak).toBe(1);
  expect(Number.isInteger(r.state.streak)).toBe(true);
});

it("RESET_RECOGNITION 후 동일 unknown 얼굴이 다시 confirm 전이를 낼 수 있다", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const u = { personId: null, displayName: null, score: 0 };

  let r = speakerIdReducer(s, u, T0);
  s = r.state;
  r = speakerIdReducer(s, u, T0);
  s = r.state;
  r = speakerIdReducer(s, u, T0);
  expect(r.event).toEqual({ type: "unknown_face" });
  s = r.state;
  expect(s.confirmed).toBe("unknown");

  r = speakerIdReducer(s, u, T0);
  expect(r.event).toBeNull();
  s = r.state;

  r = speakerIdReducer(s, { type: "RESET_RECOGNITION" }, T0);
  expect(r.event).toBeNull();
  s = r.state;
  expect(s).toEqual(INITIAL_SPEAKER_STATE);

  r = speakerIdReducer(s, u, T0);
  s = r.state;
  r = speakerIdReducer(s, u, T0);
  s = r.state;
  r = speakerIdReducer(s, u, T0);
  expect(r.event).toEqual({ type: "unknown_face" });
});

const U = { personId: null, displayName: null, score: 0 };

function enterUnknown(t: number): SpeakerIdState {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  let event = null;
  for (let i = 0; i < 3; i++) {
    const r = speakerIdReducer(s, U, t);
    s = r.state;
    event = r.event;
  }
  expect(event).toEqual({ type: "unknown_face" }); 
  expect(s.lastUnknownEmitMs).toBe(t);
  return s;
}

it("unknown 고착: 재발행 주기 직전(-1ms)에는 unknown_face 를 내지 않는다", () => {
  const s = enterUnknown(1000);
  const r = speakerIdReducer(s, U, 1000 + UNKNOWN_FACE_REEMIT_MS - 1);
  expect(r.event).toBeNull();
  expect(r.state.lastUnknownEmitMs).toBe(1000); 
});

it("unknown 고착: 재발행 주기 도달(정확히 경계)에 unknown_face 를 재발행한다", () => {
  const s = enterUnknown(1000);
  const t = 1000 + UNKNOWN_FACE_REEMIT_MS;
  const r = speakerIdReducer(s, U, t);
  expect(r.event).toEqual({ type: "unknown_face" });
  expect(r.state.confirmed).toBe("unknown"); 
  expect(r.state.lastUnknownEmitMs).toBe(t); 
});

it("재발행 후 주기가 다시 리셋된다(연속 2회 재발행 = 총 3회)", () => {
  let s = enterUnknown(0);
  const emitted: number[] = [0];

  for (let t = 10_000; t <= 180_000; t += 10_000) {
    const r = speakerIdReducer(s, U, t);
    s = r.state;
    if (r.event) {
      expect(r.event).toEqual({ type: "unknown_face" });
      emitted.push(t);
    }
  }

  expect(emitted).toEqual([0, 60_000, 120_000, 180_000]);
});

it("streak 이 끊기면(중간에 다른 후보) 재발행도 3연속을 다시 채워야 난다", () => {
  let s = enterUnknown(0);
  const known = { personId: 9, displayName: "B", score: 0.9 };

  let r = speakerIdReducer(s, known, 100_000);
  expect(r.event).toBeNull();
  s = r.state;
  expect(s.confirmed).toBe("unknown"); 

  r = speakerIdReducer(s, U, 110_000);
  expect(r.event).toBeNull();
  s = r.state;
  r = speakerIdReducer(s, U, 120_000);
  expect(r.event).toBeNull();
  s = r.state;

  r = speakerIdReducer(s, U, 130_000);
  expect(r.event).toEqual({ type: "unknown_face" });
});

it("아는 얼굴은 주기가 지나도 speaker_confirmed 를 재발행하지 않는다", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 7, displayName: "철수", score: 0.9 };

  let r = speakerIdReducer(s, a, 0);
  s = r.state;
  r = speakerIdReducer(s, a, 10_000);
  s = r.state;
  r = speakerIdReducer(s, a, 20_000);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 7, displayName: "철수" });
  s = r.state;

  for (let t = 30_000; t <= 20_000 + UNKNOWN_FACE_REEMIT_MS * 3; t += 10_000) {
    const rr = speakerIdReducer(s, a, t);
    expect(rr.event).toBeNull();
    s = rr.state;
  }
});

it("아는 얼굴은 재발행 기준점이 남아 있어도 재발행 분기를 타지 않는다(가드 직접 단언)", () => {

  const s: SpeakerIdState = { confirmed: 7, candidate: 7, streak: 3, lastUnknownEmitMs: 0 };
  const a = { personId: 7, displayName: "철수", score: 0.9 };
  const r = speakerIdReducer(s, a, UNKNOWN_FACE_REEMIT_MS * 5);
  expect(r.event).toBeNull();
  expect(r.state.lastUnknownEmitMs).toBe(0); 
});

it("speaker_confirmed 로 전이하면 재발행 상태(lastUnknownEmitMs)가 초기화된다", () => {
  let s = enterUnknown(0);
  expect(s.lastUnknownEmitMs).toBe(0);

  const a = { personId: 3, displayName: "영희", score: 0.9 };
  let r = speakerIdReducer(s, a, 10_000);
  s = r.state;
  r = speakerIdReducer(s, a, 20_000);
  s = r.state;
  r = speakerIdReducer(s, a, 30_000);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 3, displayName: "영희" });
  s = r.state;
  expect(s.lastUnknownEmitMs).toBeNull();

  let emitAt = 0;
  for (let i = 1; i <= UNCONFIRM_STREAK; i++) {
    emitAt = 30_000 + i * 10_000;
    r = speakerIdReducer(s, U, emitAt);
    s = r.state;
    if (i < UNCONFIRM_STREAK) expect(r.event).toBeNull();
  }
  expect(r.event).toEqual({ type: "unknown_face" });
  expect(s.lastUnknownEmitMs).toBe(emitAt);

  r = speakerIdReducer(s, U, emitAt + UNKNOWN_FACE_REEMIT_MS - 1);
  expect(r.event).toBeNull();
});

it("RESET_RECOGNITION 은 재발행 상태도 초기화해 주기와 무관하게 즉시 재발행 가능하다", () => {
  let s = enterUnknown(0);
  const r0 = speakerIdReducer(s, { type: "RESET_RECOGNITION" }, 1_000);
  s = r0.state;
  expect(s.lastUnknownEmitMs).toBeNull();
  expect(s).toEqual(INITIAL_SPEAKER_STATE);

  let r = speakerIdReducer(s, U, 1_000);
  expect(r.event).toBeNull();
  s = r.state;
  r = speakerIdReducer(s, U, 2_000);
  expect(r.event).toBeNull();
  s = r.state;
  r = speakerIdReducer(s, U, 3_000);
  expect(r.event).toEqual({ type: "unknown_face" });
  expect(r.state.lastUnknownEmitMs).toBe(3_000);
});

it("재발행 주기는 서버 REACT_COOLDOWN_S(60초)와 같다", () => {
  expect(UNKNOWN_FACE_REEMIT_MS).toBe(60_000);
});

const _known = { personId: 58, displayName: "도기", score: 0.8 };
const _none = { personId: null, displayName: null, score: 0 };

function _confirmed(): SpeakerIdState {
  let s = INITIAL_SPEAKER_STATE;
  for (let i = 0; i < CONFIRM_STREAK; i++) s = speakerIdReducer(s, _known, T0).state;
  return s;
}

it("확정된 사람은 unknown 3연속으로는 풀리지 않는다 — 잠깐 안 잡히는 것뿐", () => {
  let s = _confirmed();
  for (let i = 0; i < CONFIRM_STREAK; i++) {
    const r = speakerIdReducer(s, _none, T0);
    expect(r.event).toBeNull();
    s = r.state;
  }
  expect(s.confirmed).toBe(58);
});

it("그래도 계속 안 잡히면 UNCONFIRM_STREAK 에서 놓는다 — 진짜 자리를 뜬 경우", () => {
  let s = _confirmed();
  let fired: unknown = null;
  for (let i = 0; i < UNCONFIRM_STREAK; i++) {
    const r = speakerIdReducer(s, _none, T0);
    if (r.event) fired = r.event;
    s = r.state;
  }
  expect(fired).toEqual({ type: "unknown_face" });
  expect(s.confirmed).toBe("unknown");
});

it("중간에 한 번이라도 다시 잡히면 연속이 끊겨 확정이 유지된다", () => {
  let s = _confirmed();
  for (let i = 0; i < UNCONFIRM_STREAK - 1; i++) s = speakerIdReducer(s, _none, T0).state;
  s = speakerIdReducer(s, _known, T0).state;          
  for (let i = 0; i < UNCONFIRM_STREAK - 1; i++) {
    const r = speakerIdReducer(s, _none, T0);
    expect(r.event).toBeNull();
    s = r.state;
  }
  expect(s.confirmed).toBe(58);
});

it("확정 방향은 완화되지 않는다 — 아는 얼굴은 3연속에 그대로 확정", () => {
  let s = INITIAL_SPEAKER_STATE;
  let r = speakerIdReducer(s, _known, T0); s = r.state;
  r = speakerIdReducer(s, _known, T0); s = r.state;
  r = speakerIdReducer(s, _known, T0);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 58, displayName: "도기" });
});

it("아무도 확정되지 않은 통화 초반의 unknown 은 3연속이면 발행된다", () => {

  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  let fired: unknown = null;
  for (let i = 0; i < CONFIRM_STREAK; i++) {
    const r = speakerIdReducer(s, _none, T0);
    if (r.event) fired = r.event;
    s = r.state;
  }
  expect(fired).toEqual({ type: "unknown_face" });
});

it("다른 사람으로 바뀌는 것은 완화 대상이 아니다 — 3연속이면 즉시 전환", () => {
  let s = _confirmed();
  const other = { personId: 99, displayName: "민수", score: 0.8 };
  let fired: unknown = null;
  for (let i = 0; i < CONFIRM_STREAK; i++) {
    const r = speakerIdReducer(s, other, T0);
    if (r.event) fired = r.event;
    s = r.state;
  }
  expect(fired).toEqual({ type: "speaker_confirmed", personId: 99, displayName: "민수" });
});
