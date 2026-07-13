import {
  speakerIdReducer,
  INITIAL_SPEAKER_STATE,
  SpeakerIdState,
} from "../../src/face/speakerIdReducer";

it("같은 personId 3연속 → 3번째에 speaker_confirmed 1회, 4번째부터 null", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const cycle = { personId: 7, displayName: "철수", score: 0.9 };

  let r = speakerIdReducer(s, cycle);
  expect(r.event).toBeNull();
  s = r.state;

  r = speakerIdReducer(s, cycle);
  expect(r.event).toBeNull();
  s = r.state;

  r = speakerIdReducer(s, cycle);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 7, displayName: "철수" });
  s = r.state;

  r = speakerIdReducer(s, cycle);
  expect(r.event).toBeNull();
});

it("2연속 후 다른 person → streak 리셋, 이벤트 없음", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 1, displayName: "A", score: 0.9 };
  const b = { personId: 2, displayName: "B", score: 0.9 };

  let r = speakerIdReducer(s, a);
  s = r.state;
  r = speakerIdReducer(s, a);
  s = r.state;
  expect(s.streak).toBe(2);

  r = speakerIdReducer(s, b);
  expect(r.event).toBeNull();
  expect(r.state.streak).toBe(1);
  expect(r.state.candidate).toBe(2);
});

it("null(unknown) 3연속 → unknown_face 1회", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const u = { personId: null, displayName: null, score: 0 };

  let r = speakerIdReducer(s, u);
  s = r.state;
  r = speakerIdReducer(s, u);
  s = r.state;
  r = speakerIdReducer(s, u);
  expect(r.event).toEqual({ type: "unknown_face" });
});

it("confirmed A 상태에서 B 3연속 → B로 speaker_confirmed(화자 교대)", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 1, displayName: "A", score: 0.9 };
  const b = { personId: 2, displayName: "B", score: 0.9 };

  let r = speakerIdReducer(s, a);
  s = r.state;
  r = speakerIdReducer(s, a);
  s = r.state;
  r = speakerIdReducer(s, a);
  s = r.state;
  expect(s.confirmed).toBe(1);

  r = speakerIdReducer(s, b);
  expect(r.event).toBeNull();
  s = r.state;
  r = speakerIdReducer(s, b);
  expect(r.event).toBeNull();
  s = r.state;
  r = speakerIdReducer(s, b);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 2, displayName: "B" });
});

it("이미 confirmed된 대상과 같은 후보가 다시 3연속 되어도 이벤트 재발행 금지", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 1, displayName: "A", score: 0.9 };
  const b = { personId: 2, displayName: "B", score: 0.9 };

  for (let i = 0; i < 3; i++) {
    const r = speakerIdReducer(s, a);
    s = r.state;
  }
  expect(s.confirmed).toBe(1);

  let r = speakerIdReducer(s, b);
  s = r.state;
  r = speakerIdReducer(s, b);
  s = r.state;

  r = speakerIdReducer(s, a);
  expect(r.event).toBeNull(); 
  s = r.state;
  r = speakerIdReducer(s, a);
  expect(r.event).toBeNull(); 
  s = r.state;
  r = speakerIdReducer(s, a);
  expect(r.event).toBeNull(); 
  expect(r.state.confirmed).toBe(1);
});

it("confirmed unknown 상태에서 known으로 3연속 → known으로 speaker_confirmed", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const u = { personId: null, displayName: null, score: 0 };
  const a = { personId: 5, displayName: "철수", score: 0.9 };

  for (let i = 0; i < 3; i++) {
    const r = speakerIdReducer(s, u);
    s = r.state;
  }
  expect(s.confirmed).toBe("unknown");

  let r = speakerIdReducer(s, a);
  s = r.state;
  r = speakerIdReducer(s, a);
  s = r.state;
  r = speakerIdReducer(s, a);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 5, displayName: "철수" });
});

it("streak은 항상 정수이며 음수/NaN이 되지 않는다(경계)", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const a = { personId: 1, displayName: "A", score: 0.9 };
  const r = speakerIdReducer(s, a);
  expect(r.state.streak).toBe(1);
  expect(Number.isInteger(r.state.streak)).toBe(true);
});

it("RESET_RECOGNITION 후 동일 unknown 얼굴이 다시 confirm 전이를 낼 수 있다", () => {
  let s: SpeakerIdState = INITIAL_SPEAKER_STATE;
  const u = { personId: null, displayName: null, score: 0 };

  let r = speakerIdReducer(s, u);
  s = r.state;
  r = speakerIdReducer(s, u);
  s = r.state;
  r = speakerIdReducer(s, u);
  expect(r.event).toEqual({ type: "unknown_face" });
  s = r.state;
  expect(s.confirmed).toBe("unknown");

  r = speakerIdReducer(s, u);
  expect(r.event).toBeNull();
  s = r.state;

  r = speakerIdReducer(s, { type: "RESET_RECOGNITION" });
  expect(r.event).toBeNull();
  s = r.state;
  expect(s).toEqual(INITIAL_SPEAKER_STATE);

  r = speakerIdReducer(s, u);
  s = r.state;
  r = speakerIdReducer(s, u);
  s = r.state;
  r = speakerIdReducer(s, u);
  expect(r.event).toEqual({ type: "unknown_face" });
});
