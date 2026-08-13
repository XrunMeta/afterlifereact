import {
  v_be2f9f,
  v_22f27b,
  v_fcf2b4,
  v_3451db,
  v_4a199d,
  v_4fd509,
} from "../../src/face/speakerIdReducer";

const v_ca573c = 0;

it("같은 personId 3연속 → 3번째에 speaker_confirmed 1회, 4번째부터 null", () => {
  let s: v_4fd509 = v_22f27b;
  const v_bdad26 = { personId: 7, displayName: "철수", score: 0.9 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_bdad26, v_ca573c);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_bdad26, v_ca573c);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_bdad26, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 7, displayName: "철수" });
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_bdad26, v_ca573c);
  expect(v_cb35cb.event).toBeNull();
});

it("2연속 후 다른 person → streak 리셋, 이벤트 없음", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 1, displayName: "A", score: 0.9 };
  const v_148ff6 = { personId: 2, displayName: "B", score: 0.9 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  expect(v_fd5f43.streak).toBe(2);

  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6, v_ca573c);
  expect(v_cb35cb.event).toBeNull();
  expect(v_cb35cb.state.streak).toBe(1);
  expect(v_cb35cb.state.candidate).toBe(2);
});

it("null(unknown) 3연속 → unknown_face 1회", () => {
  let s: v_4fd509 = v_22f27b;
  const v_ceb55a = { personId: null, displayName: null, score: 0 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
});

it("confirmed A 상태에서 B 3연속 → B로 speaker_confirmed(화자 교대)", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 1, displayName: "A", score: 0.9 };
  const v_148ff6 = { personId: 2, displayName: "B", score: 0.9 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  expect(v_fd5f43.confirmed).toBe(1);

  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6, v_ca573c);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6, v_ca573c);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 2, displayName: "B" });
});

it("이미 confirmed된 대상과 같은 후보가 다시 3연속 되어도 이벤트 재발행 금지", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 1, displayName: "A", score: 0.9 };
  const v_148ff6 = { personId: 2, displayName: "B", score: 0.9 };

  for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_fd5f43.confirmed).toBe(1);

  let v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_148ff6, v_ca573c);
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  expect(v_cb35cb.event).toBeNull(); 
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  expect(v_cb35cb.event).toBeNull(); 
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  expect(v_cb35cb.event).toBeNull(); 
  expect(v_cb35cb.state.confirmed).toBe(1);
});

it("confirmed unknown 상태에서 known으로 3연속 → known으로 speaker_confirmed", () => {
  let s: v_4fd509 = v_22f27b;
  const v_ceb55a = { personId: null, displayName: null, score: 0 };
  const v_779914 = { personId: 5, displayName: "철수", score: 0.9 };

  for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_fd5f43.confirmed).toBe("unknown");

  let v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 5, displayName: "철수" });
});

it("streak은 항상 정수이며 음수/NaN이 되지 않는다(경계)", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 1, displayName: "A", score: 0.9 };
  const v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_ca573c);
  expect(v_cb35cb.state.streak).toBe(1);
  expect(Number.isInteger(v_cb35cb.state.streak)).toBe(true);
});

it("RESET_RECOGNITION 후 동일 unknown 얼굴이 다시 confirm 전이를 낼 수 있다", () => {
  let s: v_4fd509 = v_22f27b;
  const v_ceb55a = { personId: null, displayName: null, score: 0 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
  v_fd5f43 = v_cb35cb.state;
  expect(v_fd5f43.confirmed).toBe("unknown");

  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, { type: "RESET_RECOGNITION" }, v_ca573c);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  expect(v_fd5f43).toEqual(v_22f27b);

  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_ceb55a, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
});

const v_fa8caa = { personId: null, displayName: null, score: 0 };

function v_9780f2(v_8d41d7): v_4fd509 {
  let s: v_4fd509 = v_22f27b;
  let v_d48baf = null;
  for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, v_8d41d7);
    v_fd5f43 = v_cb35cb.state;
    v_d48baf = v_cb35cb.event;
  }
  expect(v_d48baf).toEqual({ type: "unknown_face" }); 
  expect(v_fd5f43.lastUnknownEmitMs).toBe(v_8d41d7);
  return v_fd5f43;
}

it("unknown 고착: 재발행 주기 직전(-1ms)에는 unknown_face 를 내지 않는다", () => {
  const v_fd5f43 = v_9780f2(1000);
  const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 1000 + v_fcf2b4 - 1);
  expect(v_cb35cb.event).toBeNull();
  expect(v_cb35cb.state.lastUnknownEmitMs).toBe(1000); 
});

it("unknown 고착: 재발행 주기 도달(정확히 경계)에 unknown_face 를 재발행한다", () => {
  const v_fd5f43 = v_9780f2(1000);
  const v_8d41d7 = 1000 + v_fcf2b4;
  const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, v_8d41d7);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
  expect(v_cb35cb.state.confirmed).toBe("unknown"); 
  expect(v_cb35cb.state.lastUnknownEmitMs).toBe(v_8d41d7); 
});

it("재발행 후 주기가 다시 리셋된다(연속 2회 재발행 = 총 3회)", () => {
  let v_fd5f43 = v_9780f2(0);
  const v_96bb97 = [0];

  for (let v_8d41d7 = 10_000; v_8d41d7 <= 180_000; v_8d41d7 += 10_000) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, v_8d41d7);
    v_fd5f43 = v_cb35cb.state;
    if (v_cb35cb.event) {
      expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
      v_96bb97.push(v_8d41d7);
    }
  }

  expect(v_96bb97).toEqual([0, 60_000, 120_000, 180_000]);
});

it("streak 이 끊기면(중간에 다른 후보) 재발행도 3연속을 다시 채워야 난다", () => {
  let v_fd5f43 = v_9780f2(0);
  const v_d81543 = { personId: 9, displayName: "B", score: 0.9 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_d81543, 100_000);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  expect(v_fd5f43.confirmed).toBe("unknown"); 

  v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 110_000);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 120_000);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;

  v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 130_000);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
});

it("아는 얼굴은 주기가 지나도 speaker_confirmed 를 재발행하지 않는다", () => {
  let s: v_4fd509 = v_22f27b;
  const v_779914 = { personId: 7, displayName: "철수", score: 0.9 };

  let v_cb35cb = v_be2f9f(v_fd5f43, v_779914, 0);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, 10_000);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, 20_000);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 7, displayName: "철수" });
  v_fd5f43 = v_cb35cb.state;

  for (let v_8d41d7 = 30_000; v_8d41d7 <= 20_000 + v_fcf2b4 * 3; v_8d41d7 += 10_000) {
    const v_791c92 = v_be2f9f(v_fd5f43, v_779914, v_8d41d7);
    expect(v_791c92.event).toBeNull();
    v_fd5f43 = v_791c92.state;
  }
});

it("아는 얼굴은 재발행 기준점이 남아 있어도 재발행 분기를 타지 않는다(가드 직접 단언)", () => {

  const s: v_4fd509 = { confirmed: 7, candidate: 7, streak: 3, lastUnknownEmitMs: 0 };
  const v_779914 = { personId: 7, displayName: "철수", score: 0.9 };
  const v_cb35cb = v_be2f9f(v_fd5f43, v_779914, v_fcf2b4 * 5);
  expect(v_cb35cb.event).toBeNull();
  expect(v_cb35cb.state.lastUnknownEmitMs).toBe(0); 
});

it("speaker_confirmed 로 전이하면 재발행 상태(lastUnknownEmitMs)가 초기화된다", () => {
  let v_fd5f43 = v_9780f2(0);
  expect(v_fd5f43.lastUnknownEmitMs).toBe(0);

  const v_779914 = { personId: 3, displayName: "영희", score: 0.9 };
  let v_cb35cb = v_be2f9f(v_fd5f43, v_779914, 10_000);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, 20_000);
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_779914, 30_000);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 3, displayName: "영희" });
  v_fd5f43 = v_cb35cb.state;
  expect(v_fd5f43.lastUnknownEmitMs).toBeNull();

  let v_933d8c = 0;
  for (let v_ebec57 = 1; v_ebec57 <= v_4a199d; v_ebec57++) {
    v_933d8c = 30_000 + v_ebec57 * 10_000;
    v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, v_933d8c);
    v_fd5f43 = v_cb35cb.state;
    if (v_ebec57 < v_4a199d) expect(v_cb35cb.event).toBeNull();
  }
  expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
  expect(v_fd5f43.lastUnknownEmitMs).toBe(v_933d8c);

  v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, v_933d8c + v_fcf2b4 - 1);
  expect(v_cb35cb.event).toBeNull();
});

it("RESET_RECOGNITION 은 재발행 상태도 초기화해 주기와 무관하게 즉시 재발행 가능하다", () => {
  let v_fd5f43 = v_9780f2(0);
  const v_3b9ba2 = v_be2f9f(v_fd5f43, { type: "RESET_RECOGNITION" }, 1_000);
  v_fd5f43 = v_3b9ba2.state;
  expect(v_fd5f43.lastUnknownEmitMs).toBeNull();
  expect(v_fd5f43).toEqual(v_22f27b);

  let v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 1_000);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 2_000);
  expect(v_cb35cb.event).toBeNull();
  v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_fa8caa, 3_000);
  expect(v_cb35cb.event).toEqual({ type: "unknown_face" });
  expect(v_cb35cb.state.lastUnknownEmitMs).toBe(3_000);
});

it("재발행 주기는 서버 REACT_COOLDOWN_S(60초)와 같다", () => {
  expect(v_fcf2b4).toBe(60_000);
});

const v_d66abf = { personId: 58, displayName: "도기", score: 0.8 };
const v_72a933 = { personId: null, displayName: null, score: 0 };

function v_ac55d4(): v_4fd509 {
  let v_fd5f43 = v_22f27b;
  for (let v_ebec57 = 0; v_ebec57 < v_3451db; v_ebec57++) v_fd5f43 = v_be2f9f(v_fd5f43, v_d66abf, v_ca573c).state;
  return v_fd5f43;
}

it("확정된 사람은 unknown 3연속으로는 풀리지 않는다 — 잠깐 안 잡히는 것뿐", () => {
  let v_fd5f43 = v_ac55d4();
  for (let v_ebec57 = 0; v_ebec57 < v_3451db; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_72a933, v_ca573c);
    expect(v_cb35cb.event).toBeNull();
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_fd5f43.confirmed).toBe(58);
});

it("그래도 계속 안 잡히면 UNCONFIRM_STREAK 에서 놓는다 — 진짜 자리를 뜬 경우", () => {
  let v_fd5f43 = v_ac55d4();
  let v_f5e8ef = null;
  for (let v_ebec57 = 0; v_ebec57 < v_4a199d; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_72a933, v_ca573c);
    if (v_cb35cb.event) v_f5e8ef = v_cb35cb.event;
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_f5e8ef).toEqual({ type: "unknown_face" });
  expect(v_fd5f43.confirmed).toBe("unknown");
});

it("중간에 한 번이라도 다시 잡히면 연속이 끊겨 확정이 유지된다", () => {
  let v_fd5f43 = v_ac55d4();
  for (let v_ebec57 = 0; v_ebec57 < v_4a199d - 1; v_ebec57++) v_fd5f43 = v_be2f9f(v_fd5f43, v_72a933, v_ca573c).state;
  v_fd5f43 = v_be2f9f(v_fd5f43, v_d66abf, v_ca573c).state;          
  for (let v_ebec57 = 0; v_ebec57 < v_4a199d - 1; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_72a933, v_ca573c);
    expect(v_cb35cb.event).toBeNull();
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_fd5f43.confirmed).toBe(58);
});

it("확정 방향은 완화되지 않는다 — 아는 얼굴은 3연속에 그대로 확정", () => {
  let v_fd5f43 = v_22f27b;
  let v_cb35cb = v_be2f9f(v_fd5f43, v_d66abf, v_ca573c); v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_d66abf, v_ca573c); v_fd5f43 = v_cb35cb.state;
  v_cb35cb = v_be2f9f(v_fd5f43, v_d66abf, v_ca573c);
  expect(v_cb35cb.event).toEqual({ type: "speaker_confirmed", personId: 58, displayName: "도기" });
});

it("아무도 확정되지 않은 통화 초반의 unknown 은 3연속이면 발행된다", () => {

  let s: v_4fd509 = v_22f27b;
  let v_f5e8ef = null;
  for (let v_ebec57 = 0; v_ebec57 < v_3451db; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_72a933, v_ca573c);
    if (v_cb35cb.event) v_f5e8ef = v_cb35cb.event;
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_f5e8ef).toEqual({ type: "unknown_face" });
});

it("다른 사람으로 바뀌는 것은 완화 대상이 아니다 — 3연속이면 즉시 전환", () => {
  let v_fd5f43 = v_ac55d4();
  const v_a9cbf1 = { personId: 99, displayName: "민수", score: 0.8 };
  let v_f5e8ef = null;
  for (let v_ebec57 = 0; v_ebec57 < v_3451db; v_ebec57++) {
    const v_cb35cb = v_be2f9f(v_fd5f43, v_a9cbf1, v_ca573c);
    if (v_cb35cb.event) v_f5e8ef = v_cb35cb.event;
    v_fd5f43 = v_cb35cb.state;
  }
  expect(v_f5e8ef).toEqual({ type: "speaker_confirmed", personId: 99, displayName: "민수" });
});
