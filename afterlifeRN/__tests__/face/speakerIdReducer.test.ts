import {
  speakerIdReducer,
  INITIAL_SPEAKER_STATE,
  UNKNOWN_FACE_REEMIT_MS,
  CONFIRM_STREAK,
  SpeakerIdState,
} from "../../src/face/speakerIdReducer";

const T0 = 0;

const U = { personId: null, displayName: null, score: 0 };
const dogi = { personId: 58, displayName: "도기", score: 0.8 };
const mimi = { personId: 70, displayName: "미미", score: 0.9 };

it("확정 임계는 1이다 — 매칭 1회로 즉시 확정", () => {

  expect(CONFIRM_STREAK).toBe(1);
  const r = speakerIdReducer(INITIAL_SPEAKER_STATE, dogi, T0);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 58, displayName: "도기" });
  expect(r.state.confirmed).toBe(58);
});

it("같은 사람이 계속 잡혀도 이벤트는 1회뿐", () => {
  let s = speakerIdReducer(INITIAL_SPEAKER_STATE, dogi, T0).state;
  for (let i = 1; i <= 5; i++) {
    const r = speakerIdReducer(s, dogi, i * 3000);
    expect(r.event).toBeNull();
    s = r.state;
  }
  expect(s.confirmed).toBe(58);
});

it("다른 사람이 잡히면 즉시 그 사람으로 전환한다", () => {
  const s = speakerIdReducer(INITIAL_SPEAKER_STATE, dogi, T0).state;
  const r = speakerIdReducer(s, mimi, 3000);
  expect(r.event).toEqual({ type: "speaker_confirmed", personId: 70, displayName: "미미" });
  expect(r.state.confirmed).toBe(70);
});

it("확정된 사람을 놓을 때도 1회다 — 완충은 rememberMeReducer 의 grace 가 맡는다", () => {

  const s = speakerIdReducer(INITIAL_SPEAKER_STATE, dogi, T0).state;
  const r = speakerIdReducer(s, U, 3000);
  expect(r.event).toEqual({ type: "unknown_face" });
  expect(r.state.confirmed).toBe("unknown");
});

it("unknown 도 1회에 발행된다", () => {
  const r = speakerIdReducer(INITIAL_SPEAKER_STATE, U, T0);
  expect(r.event).toEqual({ type: "unknown_face" });
});

it("unknown 이 이어져도 주기 전에는 재발행하지 않는다", () => {
  const s = speakerIdReducer(INITIAL_SPEAKER_STATE, U, 1000).state;
  expect(s.lastUnknownEmitMs).toBe(1000);
  const r = speakerIdReducer(s, U, 1000 + UNKNOWN_FACE_REEMIT_MS - 1);
  expect(r.event).toBeNull();
  expect(r.state.lastUnknownEmitMs).toBe(1000); 
});

it("unknown 고착: 주기(60초)마다 정확히 1회씩 재발행한다", () => {

  let s = speakerIdReducer(INITIAL_SPEAKER_STATE, U, 0).state;
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

it("재발행 주기는 서버 REACT_COOLDOWN_S(60초)와 같다", () => {
  expect(UNKNOWN_FACE_REEMIT_MS).toBe(60_000);
});

it("아는 얼굴은 주기가 지나도 재발행하지 않는다", () => {

  let s = speakerIdReducer(INITIAL_SPEAKER_STATE, dogi, 0).state;
  for (let t = 10_000; t <= UNKNOWN_FACE_REEMIT_MS * 3; t += 10_000) {
    const r = speakerIdReducer(s, dogi, t);
    expect(r.event).toBeNull();
    s = r.state;
  }
});

it("아는 얼굴은 재발행 기준점이 남아 있어도 재발행 분기를 타지 않는다(가드 직접 단언)", () => {

  const s: SpeakerIdState = { confirmed: 58, candidate: 58, streak: 3, lastUnknownEmitMs: 0 };
  const r = speakerIdReducer(s, dogi, UNKNOWN_FACE_REEMIT_MS * 5);
  expect(r.event).toBeNull();
  expect(r.state.lastUnknownEmitMs).toBe(0);
});

it("speaker_confirmed 로 전이하면 재발행 기준점이 초기화된다", () => {

  let s = speakerIdReducer(INITIAL_SPEAKER_STATE, U, 0).state;
  expect(s.lastUnknownEmitMs).toBe(0);
  s = speakerIdReducer(s, dogi, 10_000).state;
  expect(s.lastUnknownEmitMs).toBeNull();

  const r = speakerIdReducer(s, U, 20_000);
  expect(r.event).toEqual({ type: "unknown_face" });
  expect(r.state.lastUnknownEmitMs).toBe(20_000);
});

it("RESET_RECOGNITION 은 상태를 통째로 되돌린다 — 주기와 무관하게 즉시 재발행", () => {
  let s = speakerIdReducer(INITIAL_SPEAKER_STATE, U, 0).state;
  s = speakerIdReducer(s, { type: "RESET_RECOGNITION" }, 1_000).state;
  expect(s).toEqual(INITIAL_SPEAKER_STATE);

  const r = speakerIdReducer(s, U, 1_000);
  expect(r.event).toEqual({ type: "unknown_face" });
  expect(r.state.lastUnknownEmitMs).toBe(1_000);
});

it("streak 은 항상 정수이며 음수/NaN 이 되지 않는다(경계)", () => {
  const r = speakerIdReducer(INITIAL_SPEAKER_STATE, dogi, T0);
  expect(r.state.streak).toBe(1);
  expect(Number.isInteger(r.state.streak)).toBe(true);
});

it("순수 함수 — 입력 상태를 변형하지 않는다", () => {
  const s0 = speakerIdReducer(INITIAL_SPEAKER_STATE, dogi, T0).state;
  const snapshot = JSON.stringify(s0);
  speakerIdReducer(s0, U, 3000);
  speakerIdReducer(s0, mimi, 3000);
  expect(JSON.stringify(s0)).toBe(snapshot);
});
