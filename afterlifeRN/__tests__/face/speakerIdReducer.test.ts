import {
  v_be2f9f,
  v_22f27b,
  v_fcf2b4,
  v_3451db,
  v_4fd509,
} from "../../src/face/speakerIdReducer";

const v_ca573c = 0;

const v_fa8caa = { personId: null, displayName: null, score: 0 };
const v_c6b64b = { personId: 58, displayName: "도기", score: 0.8 };
const v_bef4d7 = { personId: 70, displayName: "미미", score: 0.9 };

it("확정 임계는 1이다 — 매칭 1회로 즉시 확정", () => {

  expect(v_3451db).toBe(1);
  const v_cb35cb = v_be2f9f(v_22f27b, v_c6b64b, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 58, displayName: "도기" });
  expect(v_cb35cb.state.confirmed).toBe(58);
});

it("같은 사람이 계속 잡혀도 이벤트는 1회뿐", () => {
  let v_fd5f43 = v_be2f9f(v_22f27b, v_c6b64b, v_ca573c).state;
  for (let v_ebec57 = 1; v_ebec57 <= 5; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_c6b64b, v_ebec57 * 3000);
    expect(v_cb35cb.event).toBeNull();
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_fd5f43.confirmed).toBe(58);
});

it("다른 사람이 잡히면 즉시 그 사람으로 전환한다", () => {
  const v_fd5f43 = v_be2f9f(v_22f27b, v_c6b64b, v_ca573c).state;
  const v_cb35cb = v_be2f9f(v_fd5f43, v_bef4d7, 3000);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 70, displayName: "미미" });
  expect(v_cb35cb.state.confirmed).toBe(70);
});

it("확정된 사람을 놓을 때도 1회다 — 완충은 rememberMeReducer 의 grace 가 맡는다", () => {

  const v_fd5f43 = v_be2f9f(v_22f27b, v_c6b64b, v_ca573c).state;
  const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 3000);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face", score: 0 });
  expect(v_cb35cb.state.confirmed).toBe("unknown");
});

it("unknown 도 1회에 발행된다", () => {
  const v_cb35cb = v_be2f9f(v_22f27b, v_fa8caa, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face", score: 0 });
});

it("unknown 이 이어져도 주기 전에는 재발행하지 않는다", () => {
  const v_fd5f43 = v_be2f9f(v_22f27b, v_fa8caa, 1000).state;
  expect(v_fd5f43.lastUnknownEmitMs).toBe(1000);
  const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 1000 + v_fcf2b4 - 1);
  expect(v_cb35cb.event).toBeNull();
  expect(v_cb35cb.state.lastUnknownEmitMs).toBe(1000); 
});

it("unknown 고착: 주기(60초)마다 정확히 1회씩 재발행한다", () => {

  let v_fd5f43 = v_be2f9f(v_22f27b, v_fa8caa, 0).state;
  const v_96bb97 = [0];
  for (let v_8d41d7 = 10_000; v_8d41d7 <= 180_000; v_8d41d7 += 10_000) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, v_8d41d7);
    v_fd5f43 = v_cb35cb.state;
    if (v_cb35cb.event) {
      expect(v_cb35cb.event).toEqual({ type: "unknown_face", score: 0 });
      v_96bb97.push(v_8d41d7);
    }
  }
  expect(v_96bb97).toEqual([0, 60_000, 120_000, 180_000]);
});

it("재발행 주기는 서버 REACT_COOLDOWN_S(60초)와 같다", () => {
  expect(v_fcf2b4).toBe(60_000);
});

it("아는 얼굴은 주기가 지나도 재발행하지 않는다", () => {

  let v_fd5f43 = v_be2f9f(v_22f27b, v_c6b64b, 0).state;
  for (let v_8d41d7 = 10_000; v_8d41d7 <= v_fcf2b4 * 3; v_8d41d7 += 10_000) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_c6b64b, v_8d41d7);
    expect(v_cb35cb.event).toBeNull();
    v_fd5f43 = v_cb35cb.state;
  }
});

it("아는 얼굴은 재발행 기준점이 남아 있어도 재발행 분기를 타지 않는다(가드 직접 단언)", () => {

  const s: v_4fd509 = { confirmed: 58, candidate: 58, streak: 3, lastUnknownEmitMs: 0 };
  const v_cb35cb = v_be2f9f(v_fd5f43, v_c6b64b, v_fcf2b4 * 5);
  expect(v_cb35cb.event).toBeNull();
  expect(v_cb35cb.state.lastUnknownEmitMs).toBe(0);
});

it("speaker_confirmed 로 전이하면 재발행 기준점이 초기화된다", () => {

  let v_fd5f43 = v_be2f9f(v_22f27b, v_fa8caa, 0).state;
  expect(v_fd5f43.lastUnknownEmitMs).toBe(0);
  v_fd5f43 = v_be2f9f(v_fd5f43, v_c6b64b, 10_000).state;
  expect(v_fd5f43.lastUnknownEmitMs).toBeNull();

  const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 20_000);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face", score: 0 });
  expect(v_cb35cb.state.lastUnknownEmitMs).toBe(20_000);
});

it("RESET_RECOGNITION 은 상태를 통째로 되돌린다 — 주기와 무관하게 즉시 재발행", () => {
  let v_fd5f43 = v_be2f9f(v_22f27b, v_fa8caa, 0).state;
  v_fd5f43 = v_be2f9f(v_fd5f43, { type: "RESET_RECOGNITION" }, 1_000).state;
  expect(v_fd5f43).toEqual(v_22f27b);

  const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 1_000);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face", score: 0 });
  expect(v_cb35cb.state.lastUnknownEmitMs).toBe(1_000);
});

it("streak 은 항상 정수이며 음수/NaN 이 되지 않는다(경계)", () => {
  const v_cb35cb = v_be2f9f(v_22f27b, v_c6b64b, v_ca573c);
  expect(v_cb35cb.state.streak).toBe(1);
  expect(Number.isInteger(v_cb35cb.state.streak)).toBe(true);
});

it("순수 함수 — 입력 상태를 변형하지 않는다", () => {
  const v_ca01e0 = v_be2f9f(v_22f27b, v_c6b64b, v_ca573c).state;
  const v_5392c4 = JSON.stringify(v_ca01e0);
  v_be2f9f(v_ca01e0, v_fa8caa, 3000);
  v_be2f9f(v_ca01e0, v_bef4d7, 3000);
  expect(JSON.stringify(v_ca01e0)).toBe(v_5392c4);
});
